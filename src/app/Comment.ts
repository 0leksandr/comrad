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

export class CommentsRepo {
    private readonly comments: { [key: number]: Comment }

    constructor(comments: Comment[]) {
        const mapped: { [key: number]: Comment } = {}
        comments.forEach(comment => { mapped[comment.id] = comment })
        this.comments = mapped
    }

    get(id: number): Comment {
        return this.comments[id]
    }

    all(): Comment[] {
        return Object.values(this.comments)
    }
}

export class IdGenerator { // TODO: remove?
    private static id = 0

    static get(): number {
        return ++IdGenerator.id
    }
}
