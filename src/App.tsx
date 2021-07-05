import React, {useEffect, useState} from 'react';
import './App.css';
import './App.sass';
import {TemplateComment, TemplateRoot} from "./Template";
import {ReactElement} from "react";
import {ComRadFC} from "./ComRad";
import {DummyComment} from "./Comment/DummyComment";
import {HabrParser} from "./Habr/HabrParser";
import {LineConnector} from "./Connector";
import {motion} from "framer-motion";
import {Tree} from "./Tree";

function App(): ReactElement {
    // console.clear()

    // let id = 0
    // const c = (children: TemplateComment[] = []) => {
    //     return new TemplateComment(
    //         new DummyComment('[author]', new Date(), 1, `comment ${++id}`),
    //         children
    //     )
    // }
    //
    // const root = new TemplateRoot(
    //     '[root]',
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
            {root ? <ComRadFC comments={root.asComments()} originalTree={root.asTree()}/> : '[x]'}
        </>
    )
}

export default App;
