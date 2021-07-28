import React, {useEffect, useState} from 'react';
import {TemplateComment, TemplateRoot} from "./Template";
import {ReactElement} from "react";
import {ComRadFC} from "./ComRad";
import {DummyArticle, DummyComment} from "./Integration/Dummy/DummyComment";
import {HabrParser} from "./Integration/Habr/HabrParser";

import '../App.sass';
import './Integration/Habr/style.sass'

function App(): ReactElement {
    // console.clear()

    // let id = 0
    // const c = (children: TemplateComment[] = []) => {
    //     return new TemplateComment(
    //         new DummyComment('[author]', new Date(), 1, `comment ${++id}`),
    //         children
    //     )
    // }
    // const root = new TemplateRoot(
    //     new DummyArticle('[root]'),
    //     [
    //         c([c(), c()]),
    //         c([c(), c()]),
    //         c([c(), c(), c()]),
    //
    //         // c([
    //         //     c(),
    //         //     c([
    //         //         c([c(), c(), c()]),
    //         //         c([c(), c()]),
    //         //     ]),
    //         // ]),
    //     ]
    // )

    const [root, setRoot] = useState<TemplateRoot>()
    useEffect(
        () => {
            new HabrParser().parseUrl(
                "Почему современная наука основана на вере?",
                "http://localhost:9473/test-comrad.html"
            )
                .then(root => setRoot(root))
        },
        []
    )

    return (
        <>
            {root ? <ComRadFC originalTree={root.asTree()}/> : '[x]'}
        </>
    )
}

export default App;
