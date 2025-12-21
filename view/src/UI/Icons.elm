{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Icons exposing
    ( Icon
    , Size(..)
    , attach
    , check
    , chevronDown
    , chevronUp
    , clock
    , close
    , copy
    , export
    , globe
    , help
    , import_
    , moon
    , plus
    , search
    , send
    , settings
    , sun
    , toHtml
    , toString
    , trash
    )

{-| Icon library using Heroicons (outline, 1.5px stroke).

Icons are defined as path data strings for dual output:

  - `toHtml` uses native Svg module for Elm views
  - `toString` builds SVG string directly for Web Components

-}

import Svg
import Svg.Attributes as SvgAttrs


{-| Icon defined by SVG path data.
-}
type Icon
    = SinglePath String
    | MultiPath (List String)


{-| Icon size variants for consistent scaling (base-3).

  - Small: 15px for compact UI
  - Medium: 18px for standard buttons
  - Large: 24px for emphasis

-}
type Size
    = Small
    | Medium
    | Large


{-| Get Tailwind size class for icon.
-}
sizeClass : Size -> String
sizeClass size =
    case size of
        Small ->
            "w-5 h-5"

        Medium ->
            "w-6 h-6"

        Large ->
            "w-8 h-8"


{-| Get path data strings from icon.
-}
pathData : Icon -> List String
pathData icon =
    case icon of
        SinglePath d ->
            [ d ]

        MultiPath ds ->
            ds


{-| Build SVG path element for Elm views.
-}
svgPath : String -> Svg.Svg msg
svgPath d =
    Svg.path
        [ SvgAttrs.d d
        , SvgAttrs.strokeLinecap "round"
        , SvgAttrs.strokeLinejoin "round"
        ]
        []


{-| Convert icon to Html for Elm views using native Svg.
-}
toHtml : Size -> Icon -> Svg.Svg msg
toHtml size icon =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeClass size)
        ]
        (List.map svgPath (pathData icon))


{-| Convert icon to String for Web Components.

Builds SVG string directly to preserve camelCase attributes (viewBox).
Html.String kebab-cases all attributes which breaks SVG rendering.

-}
toString : Size -> Icon -> String
toString size icon =
    let
        pathsStr : String
        pathsStr =
            pathData icon
                |> List.map
                    (\d ->
                        "<path d=\""
                            ++ d
                            ++ "\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></path>"
                    )
                |> String.concat
    in
    "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"currentColor\" class=\""
        ++ sizeClass size
        ++ "\">"
        ++ pathsStr
        ++ "</svg>"


{-| Icon for sending messages or submitting forms.
-}
send : Icon
send =
    SinglePath "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"


{-| Icon for attaching files.
-}
attach : Icon
attach =
    SinglePath "m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"


{-| Icon for accessing settings.
-}
settings : Icon
settings =
    MultiPath
        [ "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        , "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        ]


{-| Icon representing light mode.
-}
sun : Icon
sun =
    SinglePath "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"


{-| Icon representing dark mode.
-}
moon : Icon
moon =
    SinglePath "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"


{-| Icon for deleting items.
-}
trash : Icon
trash =
    SinglePath "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"


{-| Icon for copying content.
-}
copy : Icon
copy =
    SinglePath "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"


{-| Icon indicating success.
-}
check : Icon
check =
    SinglePath "m4.5 12.75 6 6 9-13.5"


{-| Icon for closing elements.
-}
close : Icon
close =
    SinglePath "M6 18 18 6M6 6l12 12"


{-| Icon for adding items.
-}
plus : Icon
plus =
    SinglePath "M12 4.5v15m7.5-7.5h-15"


{-| Icon for search functionality.
-}
search : Icon
search =
    SinglePath "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"


{-| Icon for help or information.
-}
help : Icon
help =
    SinglePath "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"


{-| Icon for exporting data.
-}
export : Icon
export =
    SinglePath "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"


{-| Icon for importing data.
-}
import_ : Icon
import_ =
    SinglePath "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"


{-| Icon for expanding content.
-}
chevronDown : Icon
chevronDown =
    SinglePath "m19.5 8.25-7.5 7.5-7.5-7.5"


{-| Icon for collapsing content.
-}
chevronUp : Icon
chevronUp =
    SinglePath "m4.5 15.75 7.5-7.5 7.5 7.5"


{-| Icon for time/history.
-}
clock : Icon
clock =
    SinglePath "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"


{-| Icon for language/globe.
-}
globe : Icon
globe =
    SinglePath "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
