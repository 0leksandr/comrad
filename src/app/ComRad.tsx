import React, {FC, ReactElement, useState} from "react";
import {NodeInterface, Tree} from "./Tree";
import {LineConnector} from "./Connector";
import {motion} from "framer-motion";

interface ComRadProps {
    originalTree: Tree
}

export const ComRadFC: FC<ComRadProps> = ({originalTree}) => {
    const [tree, setTree] = useState(originalTree)

    const renderNode = (node: NodeInterface, onClick: () => void): ReactElement => {
        return (
            <motion.div style={{position: 'absolute'}}
                        animate={node.absolutePosition().asStyle()}
                        // transition={{duration: 2}}
                        key={node.key()}>
                <div className={`node ${node.isRoot() ? "root" : ""}`}
                     style={node.style()}
                     onClick={onClick}>
                    <div className="comment">
                        {node.renderContent()}
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="tree">
            {tree.links.map(link => {
                return new LineConnector(link).render()
            })}
            {renderNode(tree.root, () => {})}
            {tree.nodes.map(node => {
                return renderNode(node, () => { setTree(node.asTree()) })
            })}
        </div>
    )
}
