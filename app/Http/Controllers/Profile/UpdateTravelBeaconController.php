<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateTravelBeaconRequest;
use Illuminate\Http\RedirectResponse;

class UpdateTravelBeaconController extends Controller
{
    public function __invoke(UpdateTravelBeaconRequest $request): RedirectResponse
    {
        $user = $request->user();
        $isTraveling = $request->boolean('traveling');

        $user->forceFill([
            'is_traveling' => $isTraveling,
        ])->save();

        return redirect()
            ->route('radar')
            ->with('location.travel_beacon.updated', $isTraveling);
    }
}
