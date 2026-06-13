type TreeNode = {
  key: string
  value: number
  left: TreeNode | null
  right: TreeNode | null
}


interface ITree {
  set(key: string, value: number): void
  
  get(key: string): number | undefined
  
  has(key: string): boolean
  
  delete(key: string): void
  
  entries(): Array<[ string, number ]>
  
  keys(): Array<string>
  
  values(): Array<number>
}

class TreeMap implements ITree {
  constructor(private root: TreeNode | null = null) {
  }

  private inOrderTraversal<T>(visit: (node: TreeNode) => T): T[] {
    const result: T[] = [];

    const traverse = (node: TreeNode | null) => {
      if (node === null) return;

      traverse(node.left);
      result.push(visit(node));
      traverse(node.right);
    };

    traverse(this.root);

    return result;
  }
  
  set(key: string, value: number) {
    if (this.root === null) {
      this.root = { key, value, left: null, right: null };
      return;
    }
    let current = this.root;
    while ( true ) {
      if (key < current.key) {
        if (current.left === null) {
          current.left = { key, value, left: null, right: null };
          return;
        }
        else {
          current = current.left
        }
      }
      else if (key > current.key) {
        if (current.right === null) {
          current.right = { key, value, left: null, right: null };
          return;
        }
        else {
          current = current.right
        }
      }
      else {
        current.value = value;
        return;
      }
    }
  }
  
  get(key: string): number | undefined {
    let current = this.root;
    while ( current !== null ) {
      if (key < current.key) {
        current = current.left;
      }
      else if (key > current.key) {
        current = current.right;
      }
      else {
        return current.value;
      }
    }
    return undefined;
  }
  
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: string) {
    const deleteNode = (node: TreeNode | null, targetKey: string): TreeNode | null => {
      if (node === null) return null;

      if (targetKey < node.key) {
        node.left = deleteNode(node.left, targetKey);
        return node;
      }

      if (targetKey > node.key) {
        node.right = deleteNode(node.right, targetKey);
        return node;
      }

      if (node.left === null) return node.right;
      if (node.right === null) return node.left;

      let successor = node.right;
      while (successor.left !== null) {
        successor = successor.left;
      }

      node.key = successor.key;
      node.value = successor.value;
      node.right = deleteNode(node.right, successor.key);

      return node;
    };

    this.root = deleteNode(this.root, key);
  }

  entries(): Array<[ string, number ]> {
    return this.inOrderTraversal((node) => [node.key, node.value]);
  }

  keys(): Array<string> {
    return this.inOrderTraversal((node) => node.key);
  }

  values(): Array<number> {
    return this.inOrderTraversal((node) => node.value);
  }
}
