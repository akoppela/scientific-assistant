module Main exposing (Model, init, main)

import Browser
import Html exposing (Html, div, h1, p, text)
import Html.Attributes


main : Program () Model ()
main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- MODEL


type alias Model =
    { message : String
    }


init : () -> ( Model, Cmd () )
init _ =
    ( { message = "Scientific Assistant" }
    , Cmd.none
    )



-- UPDATE


update : () -> Model -> ( Model, Cmd () )
update _ model =
    ( model, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub ()
subscriptions _ =
    Sub.none



-- VIEW


view : Model -> Html ()
view model =
    div
        [ Html.Attributes.style "display" "flex"
        , Html.Attributes.style "flex-direction" "column"
        , Html.Attributes.style "align-items" "center"
        , Html.Attributes.style "justify-content" "center"
        , Html.Attributes.style "height" "100vh"
        , Html.Attributes.style "font-family" "system-ui, sans-serif"
        ]
        [ h1
            [ Html.Attributes.style "font-size" "2.5rem"
            , Html.Attributes.style "font-weight" "bold"
            , Html.Attributes.style "margin-bottom" "1rem"
            ]
            [ text model.message ]
        , p
            [ Html.Attributes.style "color" "#666"
            , Html.Attributes.style "font-size" "1.2rem"
            ]
            [ text "Bootstrap Complete!" ]
        ]
