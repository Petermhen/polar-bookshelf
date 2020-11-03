export namespace Undo {

    export type UndoFunction = () => Promise<void>;

    export interface UndoAction {
        readonly id: number;
        readonly exec: UndoFunction;
    }

    export interface UndoQueue {

        /**
         * Adds an item to the queue and potentially resets the pointer so that
         * there are no more undo actions if we're not at the head of the queue.
         */
        readonly push: (action: UndoFunction) => Promise<IPushResult>;
        readonly undo: () => Promise<UndoResult>;
        readonly redo: () => Promise<RedoResult>;
        readonly size: () => number;

        /**
         * The pointer into the internal queue where we're going to be
         * undoing/redoing.
         */
        readonly pointer: () => number;

    }

    export interface ICreateOpts {
        readonly limit?: number;
    }

    export interface IPushResult {
        readonly removedFromHead: number;
        readonly removedFromTail: number;
    }

    export type UndoResult = 'at-head' | 'executed';

    export type RedoResult = 'at-tail' | 'executed';

    export function create(opts: ICreateOpts = {}): UndoQueue {

        const actions: UndoAction[] = [];
        let ptr: number = -1;
        const limit = opts.limit || 25;

        let seq = 0;

        async function push(undoFunction: UndoFunction): Promise<IPushResult> {

            const pushResult = {
                removedFromHead: 0,
                removedFromTail: 0
            }

            await undoFunction();

            if (actions.length > limit) {
                // we have too many items so we have to prune one and move it down.
                actions.shift();
                ptr = ptr -1;
                pushResult.removedFromHead = 1;
            }

            const end = actions.length - 1;

            if (ptr < end) {
                const count = end - ptr;
                actions.splice(ptr, count);
                pushResult.removedFromTail = count;
            }

            actions.push({
                id: seq++,
                exec: undoFunction
            });

            ptr = ptr + 1;

            return pushResult;

        }

        async function undo(): Promise<UndoResult> {

            if (ptr === 0) {
                // we are at the head of the queue so nothing left to complete.
                return 'at-head';
            }

            const action = actions[ptr];
            await action.exec();
            ptr = ptr - 1;

            return 'executed';

        }

        async function redo(): Promise<RedoResult> {

            const end = actions.length - 1;

            if (ptr === end) {
                return 'at-tail';
            }

            const action = actions[ptr];
            await action.exec();
            ptr = ptr + 1;

            return 'executed';

        }

        function size() {
            return actions.length;
        }

        function pointer() {
            return ptr;
        }

        return {push, undo, redo, size, pointer};

    }

}