import {Comment} from "./Comment";
import {YoungNode, NodePayload, YoungRoot, Tree} from "./Tree";

export class TemplateComment {
    constructor(public readonly comment: Comment, protected readonly children: TemplateComment[]) {}

    protected grow(node: YoungNode, level: number): void {
        this.children.forEach((child) => {
            const leave = node.add(new NodePayload(child.comment, level + 1))
            child.grow(leave, level + 1)
        })
    }

    protected walk(fn: (node: TemplateComment) => void): void {
        fn(this)
        this.children.forEach(child => { child.walk(fn) })
    }
}

export class TemplateRoot extends TemplateComment {
    asTree(): Tree {
        const root = new YoungRoot(new NodePayload(this.comment, 0))
        this.grow(root, 0)
        return root.asTree()
    }
}
