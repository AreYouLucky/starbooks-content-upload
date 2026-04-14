<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function() {
            const appearance = '{{ $appearance ?? 'system' }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>

        body {
            min-height: 100vh;
            overflow: hidden;
        }

        .inc-thin {
            font-family: "Nunito", sans-serif;
            font-weight: 100;
            font-style: normal;
        }

        .inc-extralight {
            font-family: "Nunito", sans-serif;
            font-weight: 200;
            font-style: normal;
        }

        .inc-light {
            font-family: "Nunito", sans-serif;
            font-weight: 300;
            font-style: normal;
        }

        .inc-regular {
            font-family: "Nunito", sans-serif;
            font-weight: 400;
            font-style: normal;
        }

        .inc-medium {
            font-family: "Nunito", sans-serif;
            font-weight: 500;
            font-style: normal;
        }

        .inc-semibold {
            font-family: "Nunito", sans-serif;
            font-weight: 600;
            font-style: normal;
        }

        .inc-bold {
            font-family: "Nunito", sans-serif;
            font-weight: 700;
            font-style: normal;
        }

        .inc-extrabold {
            font-family: "Nunito", sans-serif;
            font-weight: 800;
            font-style: normal;
        }
         .ck-editor__editable {
            min-height: 200px;
            background-color: rgba(255, 255, 255, 0.486) !important;
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
        rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead

    <link rel="icon" href="/storage/logos/starbooks.png" type="image/icon type">

</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>

