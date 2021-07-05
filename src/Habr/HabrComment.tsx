import {Comment, IdGenerator} from "../Comment/Comment";
import React from "react";

export class HabrComment extends Comment {
    constructor(private readonly comment: Element) {
        super(IdGenerator.get());
    }

    render(): React.ReactElement {
        return <div dangerouslySetInnerHTML={{__html: this.comment.innerHTML}}/>
    }
}
