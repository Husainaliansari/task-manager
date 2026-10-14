<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        // Everyone signs up as a regular user. Only an admin can promote someone.
        $user = User::create([
            ...$request->validated(),
            'role_id' => Role::named(Role::USER)->id,
        ]);

        return $this->issueToken($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        // Same message whether the email or the password is wrong,
        // so the response doesn't reveal which emails have accounts.
        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json(['message' => "That email and password don't match our records."], 401);
        }

        return $this->issueToken($user);
    }

    public function logout(Request $request): Response
    {
        // Revoke only the token used for this request (other devices stay logged in).
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /** Creates a Sanctum token that stops working after the configured lifetime. */
    private function issueToken(User $user, int $status = 200): JsonResponse
    {
        $expiresAt = now()->addMinutes(config('sanctum.expiration'));
        $token = $user->createToken('web', ['*'], $expiresAt);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toIso8601String(),
        ], $status);
    }
}
