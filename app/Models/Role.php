<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Role extends Model
{
    public const ADMIN = 'admin';

    public const USER = 'user';

    public $timestamps = false;

    /** Looks a role up by name, e.g. Role::named(Role::ADMIN). */
    public static function named(string $name): self
    {
        return static::where('name', $name)->firstOrFail();
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
