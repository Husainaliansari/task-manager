<?php

use Illuminate\Support\Facades\Route;

// The UI is the React app in resources/js. Every URL outside the API gets the
// same page, so React Router can handle /login, /team and friends.
Route::view('/{path?}', 'app')->where('path', '^(?!api(/|$)|up$).*');
