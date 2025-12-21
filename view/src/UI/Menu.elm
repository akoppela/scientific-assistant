{- This Source Code Form is subject to the terms of the Mozilla Public
   License, v. 2.0. If a copy of the MPL was not distributed with this
   file, You can obtain one at https://mozilla.org/MPL/2.0/.
-}


module UI.Menu exposing (Item(..), view)

{-| Menu component using ds-menu Web Component.

Uses native HTML popover for open/close behavior.
Responsive: bottom sheet on mobile, dropdown on desktop.

-}

import Html
import Html.Attributes as Attrs
import Html.Events as Events
import Json.Decode as Decode
import Json.Encode as Encode
import UI.Icons as Icons


{-| Menu item: clickable action or visual divider.
-}
type Item
    = Action
        { id : String
        , icon : Icons.Icon
        , label : String
        , suffix : Maybe String
        }
    | Divider


{-| Render a menu.

The trigger button must be rendered separately with `popovertarget`
matching the menu id. The Web Component finds the trigger automatically.

    Html.button
        [ Attrs.attribute "popovertarget" "settings-menu"
        ]
        [ Icons.toHtml Icons.Medium Icons.settings ]

    Menu.view
        { id = "settings-menu"
        , items = settingsMenuItems
        , gap = Nothing -- uses default 9px
        , onItemClick =
            [ ( "toggle-theme", ToggleTheme )
            , ( "help", ShowHelp )
            ]
        }

-}
view :
    { id : String
    , items : List Item
    , gap : Maybe Int
    , onItemClick : List ( String, msg )
    }
    -> Html.Html msg
view config =
    Html.node "ds-menu"
        [ Attrs.id config.id
        , Attrs.attribute "popover" ""
        , Attrs.attribute "role" "menu"
        , Attrs.class "menu"
        , Attrs.property "items" (encodeItems config.items)
        , Events.on "item-click" (decodeItemClick config.onItemClick)
        , gapAttr config.gap
        ]
        []


{-| Build gap attribute from spacing key.

Uses design system spacing tokens: 1=3px, 2=6px, 3=9px, 4=12px, 6=18px, 8=24px.
Default is 3 (9px) if Nothing.

-}
gapAttr : Maybe Int -> Html.Attribute msg
gapAttr maybeGap =
    case maybeGap of
        Just index ->
            Attrs.attribute "gap" (String.fromInt index)

        Nothing ->
            Attrs.property "" Encode.null


{-| Decode item-click event using a message lookup table.
-}
decodeItemClick : List ( String, msg ) -> Decode.Decoder msg
decodeItemClick messageLookup =
    Decode.at [ "detail", "id" ] Decode.string
        |> Decode.andThen
            (\itemId ->
                case findMessage itemId messageLookup of
                    Just msg ->
                        Decode.succeed msg

                    Nothing ->
                        Decode.fail ("Unknown menu item: " ++ itemId)
            )


{-| Find message for item ID in lookup table.
-}
findMessage : String -> List ( String, msg ) -> Maybe msg
findMessage itemId lookup =
    lookup
        |> List.filter (\( id, _ ) -> id == itemId)
        |> List.head
        |> Maybe.map Tuple.second


{-| Encode menu items to JSON for the Web Component.
-}
encodeItems : List Item -> Encode.Value
encodeItems items =
    Encode.list encodeItem items


{-| Encode a single menu item to JSON.
-}
encodeItem : Item -> Encode.Value
encodeItem item =
    case item of
        Action { id, icon, label, suffix } ->
            Encode.object
                [ ( "id", Encode.string id )
                , ( "type", Encode.string "action" )
                , ( "icon", Encode.string (Icons.toString Icons.Medium icon) )
                , ( "label", Encode.string label )
                , ( "suffix", Encode.string (Maybe.withDefault "" suffix) )
                ]

        Divider ->
            Encode.object
                [ ( "type", Encode.string "divider" )
                ]
