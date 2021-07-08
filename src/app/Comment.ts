import {Element} from "./General"
import {ReactElement} from "react";

export abstract class Comment extends Element { // TODO: rename
    protected constructor(public readonly id: number) {
        super();
    }
}

export interface CommentInterface { // TODO: use
    id(): number

    render(): ReactElement
}

export class IdGenerator { // TODO: remove?
    private static id = 0

    static get(): number {
        return ++IdGenerator.id
    }
}
