<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class QARejectedMiddleware
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->user()?->role, ['stii_admin', 'super_admin', 'admin'], true)) {
            return $next($request);
        }

        abort(403);
    }
}
