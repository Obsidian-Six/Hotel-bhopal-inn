<?php
// Daily Ops — JSON API. Needs PHP 7.4+ with pdo_sqlite (and curl for AI reading).
declare(strict_types=1);

$cfg = require __DIR__ . '/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Asia/Kolkata');

$https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
session_name('dailyops');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30, 'path' => '/', 'httponly' => true,
    'samesite' => 'Lax', 'secure' => $https,
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$DATA = rtrim($cfg['data_dir'] ?? (__DIR__ . '/data'), '/');
$UP = $DATA . '/uploads';
if (!is_dir($UP) && !@mkdir($UP, 0775, true)) fail('Cannot create data folder. Check folder permissions.', 500);
if (!file_exists($DATA . '/.htaccess')) @file_put_contents($DATA . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");

const ROLES = ['admin', 'manager', 'supervisor', 'receptionist', 'housekeeping', 'kitchen'];

// ---------------- helpers ----------------
function out($x, int $code = 200): void { http_response_code($code); echo json_encode($x, JSON_UNESCAPED_UNICODE); exit; }
function fail(string $msg, int $code = 400): void { out(['error' => $msg], $code); }

function db(): PDO {
    static $pdo = null;
    global $DATA;
    if ($pdo) return $pdo;
    $pdo = new PDO('sqlite:' . $DATA . '/dailyops.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA journal_mode=WAL');
    $pdo->exec('CREATE TABLE IF NOT EXISTS submissions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT UNIQUE, staff_id TEXT NOT NULL, role TEXT NOT NULL, date TEXT NOT NULL,
        data TEXT NOT NULL, photos TEXT NOT NULL, created_at TEXT NOT NULL, received_at TEXT NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0, verified_at TEXT, ai TEXT)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS ix_sub_date ON submissions(date)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS attendance(date TEXT, staff_id TEXT, status TEXT, PRIMARY KEY(date, staff_id))');
    $pdo->exec('CREATE TABLE IF NOT EXISTS login_fail(ip TEXT, at INTEGER)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS complaints(
        id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, room TEXT NOT NULL, type TEXT NOT NULL,
        details TEXT, source TEXT, reported_by TEXT, hk_staff TEXT, hk_names TEXT, sup_staff TEXT,
        status TEXT NOT NULL DEFAULT \'open\', created_at TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS ix_comp_date ON complaints(date)');
    return $pdo;
}

function staff_by_id(?string $id): ?array {
    global $cfg;
    foreach ($cfg['staff'] as $s) if ($s['id'] === $id) return $s;
    return null;
}
function me(): ?array { return staff_by_id($_SESSION['staff_id'] ?? null); }
function need_login(): array { $m = me(); if (!$m) fail('Please log in again', 401); return $m; }
function need_admin(): array { $m = need_login(); if ($m['role'] !== 'admin') fail('Only the owner can do this', 403); return $m; }
function need_post(): void { if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Use POST', 405); }
function body(): array { $j = json_decode(file_get_contents('php://input') ?: 'null', true); return is_array($j) ? $j : []; }
function pub_staff(array $s): array { return ['id' => $s['id'], 'name' => $s['name'], 'role' => $s['role'], 'shift' => (string)($s['shift'] ?? '')]; }
function valid_date($d): string {
    if (!is_string($d) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) || !strtotime($d)) fail('Bad date');
    return $d;
}
function row_out(array $r): array {
    $r['id'] = (int)$r['id'];
    $r['verified'] = (int)$r['verified'];
    $r['data'] = json_decode($r['data'], true) ?: new stdClass();
    $r['photos'] = json_decode($r['photos'], true) ?: [];
    $r['ai'] = $r['ai'] ? json_decode($r['ai'], true) : null;
    return $r;
}
function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0'; }

// ---------------- routes ----------------
$a = $_GET['a'] ?? '';
try {
switch ($a) {

case 'config':
    out(['config' => [
        'hotel_name' => $cfg['hotel_name'],
        'eod_cutoff' => $cfg['eod_cutoff'] ?? '22:30',
        'money_tolerance' => (float)($cfg['money_tolerance'] ?? 100),
        'rooms' => array_values(array_map('strval', $cfg['rooms'])),
        'stock_items' => $cfg['stock_items'],
        'staff' => array_map('pub_staff', $cfg['staff']),
        'ai_enabled' => !empty($cfg['anthropic_api_key']),
        'cms_enabled' => !empty($cfg['cms_key']),
        'penalty_amount' => (int)($cfg['penalty_amount'] ?? 500),
        'warning_window_days' => (int)($cfg['warning_window_days'] ?? 30),
    ]]);

case 'me':
    $m = me();
    out(['me' => $m ? pub_staff($m) : null]);

case 'login':
    need_post();
    $b = body();
    $ip = client_ip();
    $since = time() - 15 * 60;
    db()->prepare('DELETE FROM login_fail WHERE at < ?')->execute([$since]);
    $st = db()->prepare('SELECT COUNT(*) FROM login_fail WHERE ip = ?');
    $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= 10) fail('Too many wrong PINs. Try again in 15 minutes.', 429);
    $s = staff_by_id((string)($b['staff_id'] ?? ''));
    if (!$s || !hash_equals((string)$s['pin'], (string)($b['pin'] ?? ''))) {
        db()->prepare('INSERT INTO login_fail(ip, at) VALUES(?, ?)')->execute([$ip, time()]);
        usleep(600000);
        fail('Wrong PIN', 401);
    }
    session_regenerate_id(true);
    $_SESSION['staff_id'] = $s['id'];
    out(['me' => pub_staff($s)]);

case 'logout':
    need_post();
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);

case 'submit':
    need_post();
    $m = need_login();
    if ($m['role'] === 'admin') fail('The owner account does not submit EODs');
    $b = body();
    $cid = preg_replace('/[^a-zA-Z0-9-]/', '', (string)($b['client_id'] ?? ''));
    if ($cid === '') fail('Missing form id');
    $st = db()->prepare('SELECT id FROM submissions WHERE client_id = ?');
    $st->execute([$cid]);
    if ($dup = $st->fetchColumn()) out(['ok' => true, 'id' => (int)$dup, 'duplicate' => true]);

    $date = valid_date($b['date'] ?? '');
    $today = date('Y-m-d');
    if ($date > $today || $date < date('Y-m-d', strtotime('-7 days'))) fail('EOD date must be within the last 7 days');
    if (!is_array($b['data'] ?? null)) fail('Form is empty');
    if (!empty($m['shift'])) $b['data']['shift'] = $m['shift']; // Day login files day reports, Night Desk files night reports
    if (($b['data']['shift'] ?? '') === 'Night' && trim((string)($b['data']['duty_name'] ?? '')) === '') fail('Write the name of the person on night duty');
    $data = json_encode($b['data'], JSON_UNESCAPED_UNICODE);
    if (strlen($data) > 200000) fail('Form is too large');

    global $UP;
    $photos = [];
    foreach (array_slice((array)($b['photos'] ?? []), 0, 4) as $p) {
        if (!is_string($p) || !preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#s', $p, $mm)) continue;
        $bin = base64_decode($mm[2], true);
        if ($bin === false || strlen($bin) > 8 * 1024 * 1024 || !@getimagesizefromstring($bin)) continue;
        $ext = $mm[1] === 'jpeg' ? 'jpg' : $mm[1];
        $name = $date . '_' . preg_replace('/[^a-z0-9]/', '', $m['id']) . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        file_put_contents($UP . '/' . $name, $bin);
        $photos[] = $name;
    }
    if (!$photos) fail('Please attach the photo of the paper sheet');

    $created = (string)($b['created_at'] ?? '');
    $ts = strtotime($created);
    $created = ($ts && $ts <= time() + 300) ? date('c', $ts) : date('c');

    db()->prepare('INSERT INTO submissions(client_id, staff_id, role, date, data, photos, created_at, received_at)
                   VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$cid, $m['id'], $m['role'], $date, $data, json_encode($photos), $created, date('c')]);
    out(['ok' => true, 'id' => (int)db()->lastInsertId()]);

case 'mine':
    $m = need_login();
    $st = db()->prepare('SELECT * FROM submissions WHERE staff_id = ? ORDER BY created_at DESC LIMIT 10');
    $st->execute([$m['id']]);
    out(['subs' => array_map('row_out', $st->fetchAll())]);

case 'day':
    $m = need_admin();
    $date = valid_date($_GET['date'] ?? '');
    $prev = date('Y-m-d', strtotime($date . ' -1 day'));
    $st = db()->prepare('SELECT * FROM submissions WHERE date IN (?, ?) ORDER BY created_at');
    $st->execute([$date, $prev]);
    $subs = []; $prevSubs = [];
    foreach ($st->fetchAll() as $r) { $r = row_out($r); if ($r['date'] === $date) $subs[] = $r; else $prevSubs[] = $r; }
    $st = db()->prepare('SELECT staff_id, status FROM attendance WHERE date = ?');
    $st->execute([$date]);
    $att = new stdClass();
    foreach ($st->fetchAll() as $r) $att->{$r['staff_id']} = $r['status'];
    out(['date' => $date, 'subs' => $subs, 'prev' => $prevSubs, 'attendance' => $att]);

case 'month':
    need_admin();
    $mo = (string)($_GET['m'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}$/', $mo)) fail('Bad month');
    $st = db()->prepare('SELECT staff_id, date, created_at FROM submissions WHERE date LIKE ?');
    $st->execute([$mo . '-%']);
    $subs = $st->fetchAll();
    $st = db()->prepare('SELECT date, staff_id, status FROM attendance WHERE date LIKE ?');
    $st->execute([$mo . '-%']);
    out(['subs' => $subs, 'attendance' => $st->fetchAll()]);

case 'verify':
    need_post(); need_admin();
    $b = body();
    $v = !empty($b['verified']) ? 1 : 0;
    db()->prepare('UPDATE submissions SET verified = ?, verified_at = ? WHERE id = ?')
        ->execute([$v, $v ? date('c') : null, (int)($b['id'] ?? 0)]);
    out(['ok' => true]);

case 'attendance':
    need_post(); need_admin();
    $b = body();
    $date = valid_date($b['date'] ?? '');
    $sid = (string)($b['staff_id'] ?? '');
    if (!staff_by_id($sid)) fail('Unknown staff');
    $status = (string)($b['status'] ?? '');
    if ($status === '') {
        db()->prepare('DELETE FROM attendance WHERE date = ? AND staff_id = ?')->execute([$date, $sid]);
    } elseif (in_array($status, ['P', 'A', 'H', 'L'], true)) {
        db()->prepare('INSERT OR REPLACE INTO attendance(date, staff_id, status) VALUES(?, ?, ?)')->execute([$date, $sid, $status]);
    } else fail('Bad status');
    out(['ok' => true]);

case 'cms':
    need_admin();
    $key = (string)($cfg['cms_key'] ?? '');
    if ($key === '') out(['cms' => null]);
    if (!function_exists('curl_init')) fail('PHP curl is not available on this hosting.');
    $date = valid_date($_GET['date'] ?? '');
    $base = rtrim((string)($cfg['cms_api_url'] ?? ''), '/');
    $get = function (string $path) use ($base, $key) {
        $ch = curl_init($base . $path);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25,
            CURLOPT_HTTPHEADER => ['X-Integration-Key: ' . $key, 'Accept: application/json']]);
        $body = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
        if ($body === false || $code !== 200) return null;
        $j = json_decode((string)$body, true);
        return is_array($j) ? $j : null;
    };
    $a = $get('/api/finance/analytics-date?date=' . $date);
    if (!$a) fail('Could not read the hotel CMS right now.', 502);
    $food = $get('/api/finance/food-orders?date=' . $date);
    // Same day totals as the CMS Finance Audit screen (income, expenses, cash in hand)
    $fin = $get('/api/finance/ops-summary?date=' . $date);
    $isToday = $date === date('Y-m-d');
    $units = $isToday ? $get('/api/inventory/units') : null;
    $fd = $isToday ? $get('/api/bookings/front-desk/stats') : null;
    $stockItems = $isToday ? $get('/api/stock') : null;
    $inv = $isToday ? $get('/api/bookings/front-desk/ops-inventory?days=7') : null;
    $lowStock = null;
    if (is_array($stockItems)) {
        $lowStock = [];
        foreach ($stockItems as $it) {
            $q = (float)($it['quantity'] ?? 0); $mn = (float)($it['minQuantity'] ?? 0);
            if ($q <= $mn) $lowStock[] = ['name' => (string)($it['name'] ?? ''), 'category' => (string)($it['category'] ?? ''), 'unit' => (string)($it['unit'] ?? ''), 'quantity' => $q, 'min' => $mn];
        }
    }
    $rd = $a['readingDifference'] ?? [];
    $finance = null;
    if (is_array($fin)) {
        $bm = $fin['incomeByMode'] ?? [];
        $online = (float)($bm['Online'] ?? 0) + (float)($bm['UPI'] ?? 0) + (float)($bm['Card'] ?? 0) + (float)($bm['Bank Transfer'] ?? 0);
        $finance = [
            'totalIncome' => (float)($fin['totalIncome'] ?? 0), 'totalExpense' => (float)($fin['totalExpense'] ?? 0),
            'cash' => (float)($bm['Cash'] ?? 0), 'online' => $online, 'upi' => (float)($bm['UPI'] ?? 0) + (float)($bm['Online'] ?? 0),
            'card' => (float)($bm['Card'] ?? 0), 'bank' => (float)($bm['Bank Transfer'] ?? 0), 'ota' => (float)($bm['OTA'] ?? 0),
            'otaPending' => (float)($fin['otaPending'] ?? 0),
            'openingCash' => (float)($fin['openingBalance'] ?? 0), 'closingCash' => (float)($fin['closingBalance'] ?? 0),
            'cashExpense' => (float)($fin['todayCashExpense'] ?? 0),
            'byCategory' => $fin['incomeByCategory'] ?? new stdClass(),
            'expenses' => array_slice(array_values(array_map(fn($e) => [
                'category' => (string)($e['category'] ?? ''), 'description' => (string)($e['description'] ?? ''),
                'amount' => (float)($e['amount'] ?? 0), 'mode' => (string)($e['mode'] ?? ''), 'approved' => !empty($e['approved']),
                'by' => (string)($e['by'] ?? ''), 'time' => (string)($e['time'] ?? '')], (array)($fin['expenses'] ?? []))), 0, 60),
            'pendingExpenseCount' => (int)($fin['pendingExpenseCount'] ?? 0), 'pendingExpenseAmount' => (float)($fin['pendingExpenseAmount'] ?? 0),
            'handover' => is_array($fin['handover'] ?? null) ? [
                'counted' => (float)($fin['handover']['countedCash'] ?? 0), 'given' => (float)($fin['handover']['handedOver'] ?? 0),
                'system' => isset($fin['handover']['systemBalance']) ? (float)$fin['handover']['systemBalance'] : null,
                'at' => (string)($fin['handover']['at'] ?? ''), 'to' => (string)($fin['handover']['to'] ?? '')] : null,
        ];
    }
    $m = $a['meterAnalytics'] ?? [];
    // Only totals and room statuses leave this server: no guest names or phone numbers.
    $roomStatus = null;
    if (is_array($units)) {
        $roomStatus = [];
        foreach ($units as $u) if (!empty($u['roomNumber'])) $roomStatus[(string)$u['roomNumber']] = (string)($u['status'] ?? '');
    }
    out(['cms' => [
        'date' => $date,
        'checkIns' => $a['checkIns'] ?? null,
        'occupiedRooms' => $a['occupiedRooms'] ?? null,
        'totalRooms' => $a['totalRooms'] ?? null,
        'vacantRooms' => $a['vacantRooms'] ?? null,
        'cashSale' => $finance ? $finance['cash'] : ($rd['cashSale'] ?? null),
        'onlineSale' => $finance ? $finance['online'] : ($rd['onlineSale'] ?? null),
        'otaApproved' => $rd['otaApproved'] ?? null,
        'otaPending' => $rd['otaPending'] ?? null,
        'otaPendingCount' => $rd['otaPendingCount'] ?? null,
        'totalSale' => $finance ? $finance['totalIncome'] : ($rd['totalSale'] ?? null),
        'cashExpenses' => $finance ? $finance['totalExpense'] : ($rd['cashExpenses'] ?? null),
        'counterBalance' => $finance ? $finance['closingCash'] : ($rd['cashBalanceCounter'] ?? null),
        'finance' => $finance,
        'inventory' => is_array($inv) ? $inv : null,
        'foodRevenue' => is_array($food) ? ($food['totalAmount'] ?? null) : null,
        'foodOrders' => is_array($food) ? ($food['totalOrders'] ?? null) : null,
        'meterRecorded' => !empty($m['today']['recorded']),
        'meterMissedDays' => is_array($m['missedDates'] ?? null) ? count($m['missedDates']) : 0,
        'meterLastDate' => $m['yesterday']['dateStr'] ?? null,
        'roomStatus' => $roomStatus,
        'live' => is_array($fd) ? ['checkIns' => $fd['checkIns'] ?? null, 'checkOuts' => $fd['checkOuts'] ?? null,
            'inHouse' => $fd['inHouse'] ?? null, 'available' => $fd['available'] ?? null] : null,
        'lowStock' => $lowStock,
        'readAt' => date('c'),
    ]]);

case 'complaint_add':
    need_post();
    $m = need_login();
    if (!in_array($m['role'], ['admin', 'manager', 'supervisor', 'receptionist'], true)) fail('Only reception, supervisor, manager or owner can log complaints', 403);
    $b = body();
    $date = valid_date($b['date'] ?? '');
    if ($date > date('Y-m-d') || $date < date('Y-m-d', strtotime('-7 days'))) fail('Date must be within the last 7 days');
    $room = (string)($b['room'] ?? '');
    if (!in_array($room, array_map('strval', $cfg['rooms']), true)) fail('Pick a room');
    $type = (string)($b['type'] ?? '');
    if (!in_array($type, ['cleaning', 'washroom', 'other'], true)) fail('Pick the complaint type');
    $details = mb_substr(trim((string)($b['details'] ?? '')), 0, 1000);
    $source = mb_substr((string)($b['source'] ?? ''), 0, 40);
    // Who cleaned it: the housekeeping EOD (that day or the day before) that marked this room clean.
    $prev = date('Y-m-d', strtotime($date . ' -1 day'));
    $st = db()->prepare("SELECT staff_id, data FROM submissions WHERE role = 'housekeeping' AND date IN (?, ?) ORDER BY date DESC, created_at DESC");
    $st->execute([$date, $prev]);
    $hk = null; $hkNames = ''; $fallback = null;
    foreach ($st->fetchAll() as $r) {
        $d = json_decode($r['data'], true) ?: [];
        if (!$fallback) $fallback = [$r['staff_id'], (string)($d['staff_names'] ?? '')];
        if (($d['rooms'][$room] ?? '') === 'clean') { $hk = $r['staff_id']; $hkNames = (string)($d['staff_names'] ?? ''); break; }
    }
    if (!$hk && $fallback) { [$hk, $hkNames] = $fallback; }
    if (!$hk) { foreach ($cfg['staff'] as $x) if ($x['role'] === 'housekeeping') { $hk = $x['id']; break; } }
    // Who inspected it: the supervisor on duty that day (or the day before).
    $st = db()->prepare("SELECT staff_id FROM submissions WHERE role = 'supervisor' AND date IN (?, ?) ORDER BY date DESC, created_at DESC LIMIT 1");
    $st->execute([$date, $prev]);
    $sup = $st->fetchColumn() ?: null;
    if (!$sup) { foreach ($cfg['staff'] as $x) if ($x['role'] === 'supervisor') { $sup = $x['id']; break; } }
    db()->prepare('INSERT INTO complaints(date, room, type, details, source, reported_by, hk_staff, hk_names, sup_staff, created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
        ->execute([$date, $room, $type, $details, $source, $m['id'], $hk, mb_substr($hkNames, 0, 200), $sup, date('c')]);
    out(['ok' => true, 'id' => (int)db()->lastInsertId()]);

case 'complaints':
    $m = need_login();
    if ($m['role'] === 'admin') {
        $from = valid_date($_GET['from'] ?? date('Y-m-d', strtotime('-40 days')));
        $to = valid_date($_GET['to'] ?? date('Y-m-d'));
        $st = db()->prepare('SELECT * FROM complaints WHERE date BETWEEN ? AND ? ORDER BY date, id');
        $st->execute([$from, $to]);
    } else {
        $st = db()->prepare('SELECT * FROM complaints WHERE date >= ? AND (hk_staff = ? OR sup_staff = ? OR reported_by = ?) ORDER BY date, id');
        $st->execute([date('Y-m-d', strtotime('-70 days')), $m['id'], $m['id'], $m['id']]);
    }
    $rows = $st->fetchAll();
    foreach ($rows as &$r) $r['id'] = (int)$r['id'];
    out(['complaints' => $rows]);

case 'complaint_status':
    need_post(); need_admin();
    $b = body();
    $status = (string)($b['status'] ?? '');
    if (!in_array($status, ['open', 'waived'], true)) fail('Bad status');
    db()->prepare('UPDATE complaints SET status = ? WHERE id = ?')->execute([$status, (int)($b['id'] ?? 0)]);
    out(['ok' => true]);

case 'stock_history':
    need_admin();
    $date = valid_date($_GET['date'] ?? '');
    $st = db()->prepare("SELECT date, created_at, data FROM submissions WHERE role = 'kitchen' AND date BETWEEN ? AND ? ORDER BY date, created_at");
    $st->execute([date('Y-m-d', strtotime($date . ' -14 days')), $date]);
    $byDate = [];
    foreach ($st->fetchAll() as $r) { $d = json_decode($r['data'], true) ?: []; $byDate[$r['date']] = $d['stock'] ?? []; }
    out(['history' => $byDate]);

case 'photo':
    $m = need_login();
    $f = basename((string)($_GET['f'] ?? ''));
    if (!preg_match('/^[\w.-]+\.(jpg|png|webp)$/', $f)) fail('Bad file', 404);
    if ($m['role'] !== 'admin' && strpos($f, '_' . $m['id'] . '_') === false) fail('Not allowed', 403);
    global $UP;
    $path = $UP . '/' . $f;
    if (!is_file($path)) fail('Not found', 404);
    $types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    header('Content-Type: ' . $types[pathinfo($f, PATHINFO_EXTENSION)]);
    header('Cache-Control: private, max-age=2592000');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;

case 'ai_read':
    need_post(); need_admin();
    $key = (string)($cfg['anthropic_api_key'] ?? '');
    if ($key === '') fail('AI reading is off. Add an API key in config.php.');
    if (!function_exists('curl_init')) fail('PHP curl is not available on this hosting.');
    $b = body();
    $st = db()->prepare('SELECT * FROM submissions WHERE id = ?');
    $st->execute([(int)($b['id'] ?? 0)]);
    $row = $st->fetch();
    if (!$row) fail('Not found', 404);
    $sub = row_out($row);

    $lines = [];
    foreach ((array)($b['fields'] ?? []) as $f) {
        $k = preg_replace('/[^a-z0-9_]/', '', (string)($f['k'] ?? ''));
        $t = (string)($f['t'] ?? '');
        if ($k === '' || !in_array($t, ['num', 'money', 'yesno', 'select', 'stock'], true)) continue;
        $l = mb_substr(strip_tags((string)($f['l'] ?? $k)), 0, 80);
        if ($t === 'stock') {
            $items = [];
            foreach ($cfg['stock_items'] as $it) $items[] = $it['k'] . ' = ' . $it['l'];
            $lines[] = "- stock: object keyed by item, each {\"opening\":n,\"received\":n,\"used\":n,\"closing\":n}. Items: " . implode('; ', $items);
        } else {
            $hint = ['num' => 'number', 'money' => 'rupee amount as a number', 'yesno' => '"yes" or "no"', 'select' => 'text exactly as written'][$t];
            $lines[] = "- $k: $l ($hint)";
        }
    }
    if (!$lines) fail('Nothing to read for this role');

    $content = [];
    foreach ($sub['photos'] as $p) {
        $path = $UP . '/' . basename($p);
        if (!is_file($path)) continue;
        $ext = pathinfo($p, PATHINFO_EXTENSION);
        $content[] = ['type' => 'image', 'source' => [
            'type' => 'base64',
            'media_type' => ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'][$ext] ?? 'image/jpeg',
            'data' => base64_encode((string)file_get_contents($path)),
        ]];
    }
    if (!$content) fail('Photo file is missing');
    $content[] = ['type' => 'text', 'text' =>
        "These photos show a handwritten end-of-day tracker from a hotel (" . $sub['role'] . ", date " . $sub['date'] . ").\n" .
        "Read the sheet and return ONLY a JSON object with these keys:\n" . implode("\n", $lines) . "\n" .
        "Use null for anything that is not on the sheet or that you cannot read with confidence. Do not guess. No text outside the JSON."];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 90,
        CURLOPT_HTTPHEADER => ['content-type: application/json', 'x-api-key: ' . $key, 'anthropic-version: 2023-06-01'],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => $cfg['ai_model'] ?? 'claude-haiku-5-5',
            'max_tokens' => 2000,
            'messages' => [['role' => 'user', 'content' => $content]],
        ]),
    ]);
    $resp = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);
    if ($resp === false) fail('Could not reach AI service: ' . $cerr, 502);
    $j = json_decode((string)$resp, true);
    if ($code !== 200) fail('AI service error: ' . ($j['error']['message'] ?? ('HTTP ' . $code)), 502);
    $text = '';
    foreach (($j['content'] ?? []) as $c) if (($c['type'] ?? '') === 'text') $text .= $c['text'];
    $s = strpos($text, '{'); $e = strrpos($text, '}');
    $vals = ($s !== false && $e !== false) ? json_decode(substr($text, $s, $e - $s + 1), true) : null;
    if (!is_array($vals)) fail('AI could not read this photo clearly. Try a sharper photo.', 422);
    $ai = ['values' => $vals, 'at' => date('c'), 'model' => $cfg['ai_model'] ?? ''];
    db()->prepare('UPDATE submissions SET ai = ? WHERE id = ?')->execute([json_encode($ai, JSON_UNESCAPED_UNICODE), $sub['id']]);
    out(['ai' => $ai]);

default:
    fail('Unknown action', 404);
}
} catch (Throwable $e) {
    error_log('[daily-ops] ' . $e->getMessage());
    fail('Server error. Please try again.', 500);
}
