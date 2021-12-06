<?php

namespace App\Policies;

use App\Models\User;
use App\Models\DownloadLog;
use App\Models\Role;
use Illuminate\Auth\Access\HandlesAuthorization;

class DownloadLogPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view download log.
     *
     * @param  \App\Models\User  $user
     * @return bool
     */
    public function view(User $user)
    {
        return $this->checkPermission($user);
    }

    /**
     * Determine if user can approve download log.
     *
     * @param  \App\Models\User  $user
     * @return bool
     */
    public function approve(User $user)
    {
        return $this->checkPermission($user);
    }

    private function checkPermission(User $user)
    {
        if (! $user->hasVerifiedEmail()) {
            return false;
        }
        if (! $user->role instanceof Role) {
            return false;
        }

        return in_array('manage-users', $user->role->permissions);
    }
}
