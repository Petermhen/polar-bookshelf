import React from "react";
import {CKEditor5} from "../../../apps/stories/impl/ckeditor5/CKEditor5";
import {NULL_FUNCTION} from "polar-shared/src/util/Functions";
import {IActionMenuItem, NoteActionMenu} from "./NoteActionMenu";
import {NoteNavigation} from "./NoteNavigation";

interface IProps {
    readonly content: string | undefined;
}

const items: ReadonlyArray<IActionMenuItem> = [
    {
        id: 'today',
        text: 'Today'
    },
    {
        id: 'tomorrow',
        text: 'Tomorrow'
    },

]

export const NoteEditor = React.memo((props: IProps) => {

    const handleClick = React.useCallback((event: React.MouseEvent) => {
        console.log("FIXME: got click: ", event.target);
        console.log("FIXME: got click: ", event.currentTarget);
    }, []);

    return (
        <NoteActionMenu items={() => items} onItem={item => console.log('got item: ', item)}>
            <div onClick={handleClick}>
                <NoteNavigation>
                    <CKEditor5 content={props.content || ''} onChange={NULL_FUNCTION} onEditor={NULL_FUNCTION}/>
                </NoteNavigation>
            </div>
        </NoteActionMenu>
    );

});
