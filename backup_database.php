<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$dbName = 'realkinkmen';
$host = '127.0.0.1';
$user = 'root';
$pass = '';

$backupFile = 'database_backup_'.date('Ymd_His').'.sql';

// Try to find mysqldump
$mysqldump = null;
$paths = [
    '/usr/local/bin/mysqldump',
    '/opt/homebrew/bin/mysqldump',
    '/usr/bin/mysqldump',
    'mysqldump', // In PATH
];

foreach ($paths as $path) {
    if (is_executable($path) || $path === 'mysqldump') {
        $mysqldump = $path;
        break;
    }
}

if (! $mysqldump) {
    echo "ERROR: mysqldump not found. Please install MySQL client tools.\n";
    exit(1);
}

// Build command
$cmd = sprintf(
    '%s -u %s -h %s --single-transaction --quick %s > %s 2>&1',
    escapeshellarg($mysqldump),
    escapeshellarg($user),
    escapeshellarg($host),
    escapeshellarg($dbName),
    escapeshellarg($backupFile)
);

if (! empty($pass)) {
    $cmd = sprintf(
        '%s -u %s -p%s -h %s --single-transaction --quick %s > %s 2>&1',
        escapeshellarg($mysqldump),
        escapeshellarg($user),
        escapeshellarg($pass),
        escapeshellarg($host),
        escapeshellarg($dbName),
        escapeshellarg($backupFile)
    );
}

echo "Creating database backup...\n";
echo "Database: {$dbName}\n";
echo "Backup file: {$backupFile}\n\n";

exec($cmd, $output, $returnVar);

if ($returnVar === 0 && file_exists($backupFile)) {
    $size = filesize($backupFile);
    $sizeFormatted = $size > 1024 * 1024
        ? number_format($size / (1024 * 1024), 2).' MB'
        : number_format($size / 1024, 2).' KB';

    echo "✓ Backup created successfully!\n";
    echo "  File: {$backupFile}\n";
    echo "  Size: {$sizeFormatted}\n";
} else {
    echo "✗ Backup failed!\n";
    if (! empty($output)) {
        echo "\nError output:\n";
        echo implode("\n", $output)."\n";
    }
    exit(1);
}
