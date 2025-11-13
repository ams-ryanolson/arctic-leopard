<?php

use App\Http\Middleware\EnsureProfileIsCompleted;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(__DIR__.'/../routes/channels.php')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'profile.completed' => EnsureProfileIsCompleted::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);

        $middleware->statefulApi();
        $middleware->authenticateSessions();

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $renderNotFound = static function () {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Not Found',
                ], 404);
            }

            return Inertia::render('Errors/NotFound', [
                'status' => 404,
            ])->toResponse(request())->setStatusCode(404);
        };

        $exceptions->renderable(
            static fn (NotFoundHttpException $exception) => $renderNotFound()
        );

        $exceptions->renderable(
            static fn (ModelNotFoundException $exception) => $renderNotFound()
        );

        $exceptions->respond(function (Response $response, \Throwable $_exception, Request $request) use ($renderNotFound) {
            if ($request->expectsJson()) {
                return $response;
            }

            $status = $response->getStatusCode();

            // Redirect 403 errors from admin routes to dashboard
            if ($status === 403 && str_starts_with($request->path(), 'admin')) {
                return redirect()->route('dashboard');
            }

            if (in_array($status, [500, 503, 403], true)) {
                return Inertia::render('Errors/Unexpected', [
                    'status' => $status,
                    'exceptionMessage' => app()->hasDebugModeEnabled() ? $_exception->getMessage() : null,
                    'exceptionClass' => app()->hasDebugModeEnabled() ? $_exception::class : null,
                    'debug' => app()->hasDebugModeEnabled(),
                ])->toResponse($request)->setStatusCode($status);
            }

            if ($status === 404) {
                return $renderNotFound();
            }

            if ($status === 419) {
                return back()->with([
                    'message' => 'The page expired, please try again.',
                ]);
            }

            return $response;
        });
    })->create();
