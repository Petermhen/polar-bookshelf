import {HandleStyles, ResizeEnable, Rnd} from "react-rnd";
import * as React from "react";
import {useState} from "react";
import {ILTRect} from "polar-shared/src/util/rects/ILTRect";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {Dictionaries} from "polar-shared/src/util/Dictionaries";
import {deepMemo} from "../../../../web/js/react/ReactUtils";
import {useWindowResizeEventListener} from "../../../../web/js/react/WindowHooks";
import {IPoint} from "../../../../web/js/Point";

interface IProps {
    readonly id?: string;
    readonly style?: React.CSSProperties;
    readonly resizeHandleStyle?: React.CSSProperties;

    readonly className?: string;

    readonly bounds?: string;

    readonly document?: Document;
    readonly window?: Window;

    /**
     * Used to compute the initial position of the resize box during initial
     * mount and on resize of the window.
     */
    readonly computeInitialPosition: () => ILTRect;

    readonly resizeHandleStyles?: HandleStyles;

    readonly onResized?: (resizeRect: ILTRect) => void;

    readonly onContextMenu?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;

    readonly enableResizing?: ResizeEnable;

    readonly resizeAxis?: 'y'

    /**
     * Enable a 'position hack' to work with iframes since I can't do
     * positioning myself.
     */
    readonly enablePositionHack?: boolean;

}

interface IState {
    readonly active: boolean;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

function deriveStateFromInitialPosition(computeInitialPosition: () => ILTRect): IState {

    const initialPosition = computeInitialPosition();

    return {
        active: true,
        x: initialPosition.left,
        y: initialPosition.top,
        width: initialPosition.width,
        height: initialPosition.height
    };

}

export const ResizeBox = deepMemo((props: IProps) => {

    const computeState = () => deriveStateFromInitialPosition(props.computeInitialPosition);

    const [state, setState] = useState<IState>(computeState);
    const rndRef = React.useRef<Rnd | null>(null);

    // FIXME: there are two main problems with this component:
    //
    // - FIXME: it doesn't seem to work with margin with the body...
    // - FIXME: I could get it to work with top/left and NO translate but
    //   otherwise it will fail to work and I'm not sure what resize would do in
    //   that situation

    useWindowResizeEventListener(() => {
        const newState = computeState();
        setState(newState);

        // rndRef.current!.updateSize(newState);
        // rndRef.current!.updatePosition(newState);

    }, {win: props.window});

    const handleResize = React.useCallback((newState: IState) => {

        console.log("FIXME newState: ", newState);

        function computeDerivedState(): IState {

            if (props.resizeAxis === 'y') {
                return {
                    active: newState.active,
                    x: state.x,
                    y: newState.y,
                    width: state.width,
                    height: newState.height
                }
            }

            return newState;

        }

        function updateElementStyle(newState: IState) {

            const div = rndRef.current?.resizableElement.current;

            if (div) {
                console.log("FIXME: using updateElementSType");
                div.style.top = `${newState.x}px`;
                div.style.left = `${newState.y}px`;
                div.style.width = `${newState.width}px`;
                div.style.height = `${newState.height}px`;
                div.style.transform = 'none';
            } else {
                console.warn('no div');
            }
        }

        newState = computeDerivedState();
        updateElementStyle(newState);

        // setState({...newState, x: 0, y: 0});
        setState(newState);

        try {

            // It's important to always catch exceptions here as if we don't
            // then react-rnd breaks.

            const onResized = props.onResized || NULL_FUNCTION

            onResized({
                left: newState.x,
                top: newState.y,
                width: newState.width,
                height: newState.height
            });

        } catch (e) {
            console.error(e);
        }

    }, [])

    // force pointer events on the resize corners.
    const resizeHandleStyle: React.CSSProperties = {
        pointerEvents: 'auto',
        ...(props.resizeHandleStyle || {})
    };

    const handleOnMouseOver = () => {
        setState({
            ...state,
            active: true
        });
    }

    const handleOnMouseOut = () => {
        setState({
            ...state,
            active: false
        });
    }

    const dataProps = Dictionaries.filter<any>(props, key => key.startsWith('data-'));

    const outlineSize = 5
    const outlineSizePX = `${outlineSize}px`;

    const resizeStyles = {
        vertical: {
            width: outlineSizePX
        },
        horizontal: {
            height: outlineSizePX
        },
        corner: {
            width: outlineSizePX,
            height: outlineSizePX
        }
    }

    function computePosition(state: IState): IPoint {

        if (props.enablePositionHack) {
            return {x: 0, y: 0};
        }

        return {x: state.x, y: state.y};

    }

    function computeStyle(): React.CSSProperties {

        if (props.enablePositionHack) {
            return {
                top: `${state.y}px`,
                left: `${state.x}px`
            };
        }

        return {};
    }

    const position = computePosition(state);
    const style = computeStyle();

    return (
        <>

            {/*{state.active &&*/}
            {/*    <ControlBar bottom={state.y} left={state.x} width={state.width}/>}*/}

            <Rnd
                ref={ref => rndRef.current = ref}
                id={props.id}
                bounds={props.bounds || "parent"}
                className={props.className}
                size={{
                    width: state.width,
                    height: state.height
                }}
                position={position}
                // onMouseOver={() => handleOnMouseOver()}
                // onMouseOut={() => handleOnMouseOut()}
                onDragStop={(e, d) => {
                    handleResize({
                        ...state,
                        x: d.x,
                        y: d.y
                    });
                }}
                onResizeStop={(event,
                               direction,
                               elementRef,
                               delta) => {

                    const width = state.width + delta.width;
                    const height = state.height + delta.height;

                    handleResize({
                        ...state,
                        width,
                        height,
                    });

                }}
                disableDragging={true}
                enableResizing={props.enableResizing}
                resizeHandleStyles={{
                    top: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.top,
                        ...resizeStyles.horizontal,
                        top: '0px'
                    },
                    bottom: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.bottom,
                        ...resizeStyles.horizontal,
                        bottom: '0px'
                    },
                    left: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.left,
                        ...resizeStyles.vertical,
                        left: '0px',
                    },
                    right: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.right,
                        ...resizeStyles.vertical,
                        right: '0px'
                    },
                    topLeft: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.topLeft,
                        ...resizeStyles.corner,
                        top: `0px`,
                        left: `0px`
                    },
                    topRight: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.topRight,
                        ...resizeStyles.corner,
                        top: `0px`,
                        right: `0px`
                    },
                    bottomLeft: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.bottomLeft,
                        ...resizeStyles.corner,
                        bottom: `0px`,
                        left: `0px`
                    },
                    bottomRight: {
                        ...resizeHandleStyle,
                        ...props.resizeHandleStyles?.bottomRight,
                        ...resizeStyles.corner,
                        bottom: `0px`,
                        right: `0px`
                    },
                }}
                style={{
                    ...props.style,
                    pointerEvents: 'none',
                    ...style
                }}
                {...dataProps}>
                {/*<div onContextMenu={props.onContextMenu}*/}
                {/*     style={{*/}
                {/*         width: state.width,*/}
                {/*         height: state.height*/}
                {/*     }}>*/}

                {/*</div>*/}
            </Rnd>
        </>
    );

})
