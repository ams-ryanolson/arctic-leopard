<?php

namespace App\Http\Controllers\Ads;

use App\Enums\Ads\AdPlacement;
use App\Http\Controllers\Controller;
use App\Http\Resources\Ads\AdCreativeResource;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\Ads\AdImpression;
use App\Services\Ads\AdServingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class AdController extends Controller
{
    public function __construct(
        private AdServingService $adServingService,
    ) {}

    /**
     * Serve an ad for a specific placement.
     */
    public function serve(Request $request, string $placement): JsonResponse|Response
    {
        try {
            $adPlacement = AdPlacement::from($placement);
        } catch (\ValueError $e) {
            return response()->json(['error' => 'Invalid placement'], Response::HTTP_BAD_REQUEST);
        }

        $viewer = $request->user();
        $context = [
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->header('referer'),
        ];

        $creative = $this->adServingService->serve($adPlacement, $viewer, $context);

        if ($creative === null) {
            return response()->json(null, Response::HTTP_NO_CONTENT);
        }

        // Record impression asynchronously
        $this->adServingService->recordImpression($creative, $adPlacement, $viewer, $context);

        return (new AdCreativeResource($creative))->toResponse($request);
    }

    /**
     * Record an impression.
     */
    public function recordImpression(Request $request, Ad $ad): JsonResponse
    {
        $request->validate([
            'creative_id' => ['required', 'integer', 'exists:ad_creatives,id'],
            'placement' => ['required', 'string'],
        ]);

        try {
            $placement = AdPlacement::from($request->string('placement')->toString());
        } catch (\ValueError $e) {
            throw ValidationException::withMessages(['placement' => 'Invalid placement']);
        }

        $creative = AdCreative::findOrFail($request->integer('creative_id'));

        if ($creative->ad_id !== $ad->getKey()) {
            return response()->json(['error' => 'Creative does not belong to this ad'], Response::HTTP_BAD_REQUEST);
        }

        $viewer = $request->user();
        $context = [
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->header('referer'),
        ];

        $this->adServingService->recordImpression($creative, $placement, $viewer, $context);

        return response()->json(['message' => 'Impression recorded'], Response::HTTP_CREATED);
    }

    /**
     * Record a click.
     */
    public function recordClick(Request $request, Ad $ad): JsonResponse
    {
        $request->validate([
            'creative_id' => ['required', 'integer', 'exists:ad_creatives,id'],
            'placement' => ['required', 'string'],
            'impression_id' => ['nullable', 'integer', 'exists:ad_impressions,id'],
        ]);

        try {
            $placement = AdPlacement::from($request->string('placement')->toString());
        } catch (\ValueError $e) {
            throw ValidationException::withMessages(['placement' => 'Invalid placement']);
        }

        $creative = AdCreative::findOrFail($request->integer('creative_id'));

        if ($creative->ad_id !== $ad->getKey()) {
            return response()->json(['error' => 'Creative does not belong to this ad'], Response::HTTP_BAD_REQUEST);
        }

        $viewer = $request->user();
        $impression = $request->filled('impression_id')
            ? AdImpression::find($request->integer('impression_id'))
            : null;

        $context = [
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        $this->adServingService->recordClick($creative, $placement, $viewer, $context, $impression);

        return response()->json(['message' => 'Click recorded'], Response::HTTP_CREATED);
    }

    /**
     * Track click and redirect to CTA URL.
     */
    public function trackClick(Request $request, Ad $ad): RedirectResponse
    {
        $request->validate([
            'creative_id' => ['required', 'integer', 'exists:ad_creatives,id'],
            'placement' => ['required', 'string'],
            'impression_id' => ['nullable', 'integer', 'exists:ad_impressions,id'],
        ]);

        try {
            $placement = AdPlacement::from($request->string('placement')->toString());
        } catch (\ValueError $e) {
            abort(Response::HTTP_BAD_REQUEST, 'Invalid placement');
        }

        $creative = AdCreative::findOrFail($request->integer('creative_id'));

        if ($creative->ad_id !== $ad->getKey()) {
            abort(Response::HTTP_BAD_REQUEST, 'Creative does not belong to this ad');
        }

        $viewer = $request->user();
        $impression = $request->filled('impression_id')
            ? AdImpression::find($request->integer('impression_id'))
            : null;

        $context = [
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        // Record click
        $this->adServingService->recordClick($creative, $placement, $viewer, $context, $impression);

        // Redirect to CTA URL
        return redirect()->away($creative->cta_url);
    }
}
