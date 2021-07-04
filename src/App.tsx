import React from 'react';
import './App.css';
import './App.sass';
import {Comment} from "./Comment";
import {TemplateComment, TemplateRoot} from "./Template";
import {ReactElement} from "react";
import {ComRadFC} from "./ComRad";

function App(): ReactElement {
    // console.clear()

    let id = 0
    const c = (children: TemplateComment[] = []) => {
        return new TemplateComment(
            new Comment('[author]', new Date(), 1, `comment ${++id}`),
            children
        )
    }

    const root = new TemplateRoot(
        '[root]',
        [
            c([c(), c()]),
            c([c(), c()]),
            c([c(), c(), c()]),

            // c([
            //     c(),
            //     c([
            //         c([c(), c(), c()]),
            //         c([c(), c()]),
            //     ]),
            // ]),
        ]
    )
    return (
        <ComRadFC comments={root.asComments()} originalTree={root.asTree()}/>
    )
}

export default App;
