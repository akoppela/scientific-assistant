{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Icons exposing
    ( Size(..)
    , attach
    , check
    , chevronDown
    , chevronUp
    , close
    , copy
    , export
    , help
    , import_
    , moon
    , plus
    , search
    , send
    , settings
    , sun
    , trash
    )

{-| Icon library using Heroicons (outline style).

All icons are inline SVG with stroke="currentColor" for color inheritance.
Each icon function requires a Size parameter (Small, Medium, or Large).

-}

import Html
import Svg
import Svg.Attributes as SvgAttrs


{-| Icon size variants for consistent scaling (base-3).

  - Small: 15px for compact UI
  - Medium: 18px for standard buttons
  - Large: 24px for emphasis

-}
type Size
    = Small
    | Medium
    | Large


{-| Internal helper for size conversion.
-}
sizeToClass : Size -> String
sizeToClass size =
    case size of
        Small ->
            "w-4 h-4"

        Medium ->
            "w-5 h-5"

        Large ->
            "w-6 h-6"


{-| Icon for sending messages or submitting forms.
-}
send : Size -> Html.Html msg
send size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            ]
            []
        ]


{-| Icon for attaching files.
-}
attach : Size -> Html.Html msg
attach size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
            ]
            []
        ]


{-| Icon for accessing settings.
-}
settings : Size -> Html.Html msg
settings size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            ]
            []
        , Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            ]
            []
        ]


{-| Icon representing light mode.
-}
sun : Size -> Html.Html msg
sun size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
            ]
            []
        ]


{-| Icon representing dark mode.
-}
moon : Size -> Html.Html msg
moon size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
            ]
            []
        ]


{-| Icon for deleting items.
-}
trash : Size -> Html.Html msg
trash size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            ]
            []
        ]


{-| Icon for copying content.
-}
copy : Size -> Html.Html msg
copy size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
            ]
            []
        ]


{-| Icon indicating success.
-}
check : Size -> Html.Html msg
check size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m4.5 12.75 6 6 9-13.5"
            ]
            []
        ]


{-| Icon for closing elements.
-}
close : Size -> Html.Html msg
close size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M6 18 18 6M6 6l12 12"
            ]
            []
        ]


{-| Icon for adding items.
-}
plus : Size -> Html.Html msg
plus size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M12 4.5v15m7.5-7.5h-15"
            ]
            []
        ]


{-| Icon for search functionality.
-}
search : Size -> Html.Html msg
search size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            ]
            []
        ]


{-| Icon for help or information.
-}
help : Size -> Html.Html msg
help size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            ]
            []
        ]


{-| Icon for exporting data.
-}
export : Size -> Html.Html msg
export size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            ]
            []
        ]


{-| Icon for importing data.
-}
import_ : Size -> Html.Html msg
import_ size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            ]
            []
        ]


{-| Icon for expanding content.
-}
chevronDown : Size -> Html.Html msg
chevronDown size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m19.5 8.25-7.5 7.5-7.5-7.5"
            ]
            []
        ]


{-| Icon for collapsing content.
-}
chevronUp : Size -> Html.Html msg
chevronUp size =
    Svg.svg
        [ SvgAttrs.fill "none"
        , SvgAttrs.viewBox "0 0 24 24"
        , SvgAttrs.strokeWidth "1.5"
        , SvgAttrs.stroke "currentColor"
        , SvgAttrs.class (sizeToClass size)
        ]
        [ Svg.path
            [ SvgAttrs.strokeLinecap "round"
            , SvgAttrs.strokeLinejoin "round"
            , SvgAttrs.d "m4.5 15.75 7.5-7.5 7.5 7.5"
            ]
            []
        ]
