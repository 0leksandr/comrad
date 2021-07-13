import React, {FC, useState} from "react";
import {Tree} from "./Tree";
import {LineConnector} from "./Connector";
import {motion} from "framer-motion";

interface ComRadProps {
    originalTree: Tree
}

export const ComRadFC: FC<ComRadProps> = ({originalTree}) => {
    const [tree, setTree] = useState(originalTree)

    return (
        <div className="tree">
            {tree.links.map(link => {
                return new LineConnector(link).render()
            })}
            <motion.div className="node" // TODO: do not duplicate
                        key="root"
                        style={tree.root.style()}
                        animate={tree.root.absolutePosition().asStyle()}>
                <div className="comment-holder">
                    <div className="comment">
                        {tree.root.payload.comment.render()}
                    </div>
                </div>
            </motion.div>
            {tree.nodes.map(node => {
                const comment = node.payload.comment

                return (
                    <motion.div className="node"
                                key={comment.id}
                                style={node.style()}
                                animate={node.absolutePosition().asStyle()}
                                onClick={() => { setTree(node.asTree()) }}
                    >
                        <div className="comment-holder">
                            <div className="comment">
                                {comment.render()}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
