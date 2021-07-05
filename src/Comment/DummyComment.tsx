import React, {ReactElement} from "react";
import {Comment, IdGenerator} from "./Comment";

export class DummyComment extends Comment {
    constructor(
        private readonly author: string,
        private readonly date: Date,
        private readonly rating: number,
        private readonly text: string
    ) {
        super(IdGenerator.get())
    }

    render(): ReactElement {
        return (
            <>
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
            </>
        )
    }
}

export class DummyArticle extends Comment { // TODO: rename?
    constructor(public readonly text: string) {
        super(0);
    }

    render(): React.ReactElement {
        return <>{this.text}</>
    }
}
