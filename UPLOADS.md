# Uploads & FilePond Integration

## Overview

The onboarding media step now uses **FilePond** as the unified uploader for avatars, covers, and future media surfaces. Uploads are stored in two phases:

1. **Temporary storage** – files are uploaded to a configurable disk (`uploads.temporary_disk`) so FilePond can provide instant previews.
2. **Finalization** – when the step is submitted the temporary file is promoted into a user-specific directory on the default filesystem disk and the relative path is saved on the `users` table (`avatar_path` / `cover_path`). The `User` model exposes `avatar_url` and `cover_url` accessors that call `Storage::url()` against the configured default disk.

This design works locally (with MinIO via Herd) and in production (S3 / DigitalOcean Spaces) without code changes.

## Frontend Usage

- The reusable component lives at `resources/js/components/filepond-uploader.tsx`.
- Pass `onProcess` / `onRemove` callbacks to capture the server identifier and update local previews.
- Styling is handled once inside the component (plugins, CSS, and headers), so every screen gets consistent behaviour. Pintura support can be added later by extending this component.

## API Endpoints

All endpoints live under `/api/uploads/tmp` and require authentication:

| Method | Route                    | Description                              |
|--------|--------------------------|------------------------------------------|
| POST   | `/api/uploads/tmp`       | Accepts multipart upload from FilePond.  |
| DELETE | `/api/uploads/tmp`       | Removes a temporary upload (body = id).  |
| GET    | `/api/uploads/tmp/{id}`  | Streams a temporary file back to client. |

Temporary uploads are cleaned via the `uploads:clean-temp` artisan command (scheduled hourly).

## Environment Variables

Set these values to use Herd’s MinIO instance during local development:

```dotenv
FILESYSTEM_DISK=s3
UPLOAD_TMP_DISK=s3

AWS_BUCKET=herd-bucket
AWS_ACCESS_KEY_ID=herd
AWS_SECRET_ACCESS_KEY=secretkey
AWS_DEFAULT_REGION=us-east-1
AWS_USE_PATH_STYLE_ENDPOINT=true
AWS_ENDPOINT=http://localhost:9090
AWS_URL=http://localhost:9090/herd-bucket
```

Optional overrides:

```dotenv
UPLOAD_TMP_DIRECTORY=tmp/uploads   # default directory for temporary files
UPLOAD_MAX_FILE_SIZE=102400        # KB, defaults to 100 MB
UPLOAD_TMP_TTL=60                  # minutes before temporary files are purged
```

**Important**: Ensure your PHP configuration allows uploads of this size:
- `upload_max_filesize` should be at least `100M` (or higher if you increase `UPLOAD_MAX_FILE_SIZE`)
- `post_max_size` should be slightly larger (e.g., `110M`) to account for multipart overhead
- Check your `php.ini` or use `php -i | grep upload_max_filesize` to verify current limits

For production (S3 or DigitalOcean Spaces) set the same AWS variables to match the target bucket. The application always stores relative paths, so generating public URLs relies on `Storage::url()` for the configured disk.

> **Heads up**  
> If you raise `UPLOAD_MAX_FILE_SIZE`, also ensure the PHP `upload_max_filesize` and `post_max_size` ini values are at least as large, otherwise uploads will be rejected before Laravel can handle them.

## Artisan Command

```
php artisan uploads:clean-temp       # run cleanup immediately
php artisan uploads:clean-temp --dry # log what would be deleted
```

The command removes files older than `UPLOAD_TMP_TTL` minutes from the temporary disk. It is automatically scheduled hourly via `routes/console.php`.

## Testing

`tests/Feature/Uploads/TemporaryUploadsTest.php` covers:
- Uploading and deleting temporary files.
- Promoting avatar and cover uploads during the onboarding media step.

Run the suite with:

```
php artisan test --filter=TemporaryUploadsTest
```

## Next Steps

- When ready to enable advanced editing, add the Pintura plugin to `filepond-uploader.tsx` and pass editor options through the component.
- Other upload surfaces (media galleries, galleries, etc.) should reuse the same component and backend endpoints to stay consistent.


