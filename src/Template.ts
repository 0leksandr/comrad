import {AbstractComment, Article, CommentsRepo} from "./Comment";
import {Node, NodePayload, Root, Tree} from "./Tree";

abstract class TemplateNode {
    constructor(public readonly comment: AbstractComment, protected readonly children: TemplateComment[]) {}

    protected grow(node: Node, level: number): void {
        this.children.forEach((child, index) => {
            node.add(new NodePayload(child.comment, level + 1))
            child.grow(node.children[index], level + 1)
        })
    }

    protected walk(fn: (node: TemplateNode) => void): void {
        fn(this)
        this.children.forEach(child => { child.walk(fn) })
    }
}

export class TemplateRoot extends TemplateNode {
    constructor(private title: string, children: TemplateComment[]) {
        super(new Article(title), children);
    }

    asTree(): Tree {
        const root = new Root(new NodePayload(this.comment, 0), .5)
        this.grow(root, 0)
        return new Tree(root)
    }

    asComments(): CommentsRepo {
        const comments: AbstractComment[] = []
        this.walk((node: TemplateNode) => {
            comments.push(node.comment)
        })
        return new CommentsRepo(comments)
    }
}

export class TemplateComment extends TemplateNode {}
