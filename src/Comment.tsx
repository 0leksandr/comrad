import React, {ReactElement} from "react";
import {Element} from "./Element"

export abstract class AbstractComment extends Element { // TODO: rename
    abstract id(): number
}

export class Comment extends AbstractComment {
    private readonly _id: number
    private static id = 0

    constructor(
        public readonly author: string,
        public readonly date: Date,
        public readonly rating: number,
        public readonly text: string
    ) {
        super()
        this._id = ++Comment.id
    }

    id(): number {
        return this._id
    }

    render(): ReactElement {
        return (
            <div className="comment-holder">
                <div className="comment">
                    <div className="author">{this.author}</div>
                    <div className="date">{
                        [{year: 'numeric'}, {month: 'short'}, {day: 'numeric'}]
                            .map(f => {
                                // @ts-ignore
                                return new Intl.DateTimeFormat('en', f).format(this.date)
                            })
                            .join("-")
                    }</div>
                    <div className="rating">{this.rating}</div>
                    <div className="text">{this.text}</div>
                </div>
            </div>
        )
    }
}

export class Article extends AbstractComment { // TODO: rename?
    constructor(public readonly text: string) {
        super();
    }

    id(): number {
        return 0
    }

    render(): React.ReactElement {
        return (
            <div className="comment-holder">
                <div className="root">
                    {this.text}
                </div>
            </div>
        )
    }
}

export class CommentsRepo {
    private readonly comments: { [key: number]: AbstractComment }

    constructor(comments: AbstractComment[]) {
        const mapped: { [key: number]: AbstractComment } = {}
        comments.forEach(comment => { mapped[comment.id()] = comment })
        this.comments = mapped
    }

    get(id: number): AbstractComment {
        return this.comments[id]
    }

    all(): AbstractComment[] {
        return Object.values(this.comments)
    }
}
