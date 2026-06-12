import { Matrix } from "./Matrix.js";

const matrix = new Matrix(Uint8Array, 2, 2);

matrix.set(0, 0, 1);

interface IGraph {
  hasEdge(from: number, to: number, weight?: number): boolean;
  
  addEdge(from: number, to: number): void;
  
  removeEdge(from: number, to: number): void;
  
  hasArc(from: number, to: number): boolean;
  
  addArc(from: number, to: number, weight?: number): void;
  
  removeArc(from: number, to: number): void;
}

class Graph implements IGraph {
  constructor(private matrix: Matrix<number, Uint8Array>, private options: { directed: boolean }) {
  
  }
  
  hasEdge(from: number, to: number): boolean {
    const arc1 = this.matrix.get(from, to) !== 0;
    const arc2 = this.matrix.get(to, from) !== 0;
    return arc1 && arc2;
  }
  
  addEdge(from: number, to: number, weight?: number): void {
    this.matrix.set(from, to, weight ?? 1);
    this.matrix.set(to, from, weight ?? 1);
  }
  
  removeEdge(from: number, to: number): void {
    this.matrix.set(from, to, 0);
    this.matrix.set(to, from, 0);
  }
  
  hasArc(from: number, to: number): boolean {
    return this.matrix.get(from, to) !== 0;
  }
  
  addArc(from: number, to: number, weight?: number): void {
    this.matrix.set(from, to, weight ?? 1);
  }
  
  removeArc(from: number, to: number): void {
    this.matrix.set(from, to, 0);
  }
}

const graph = new Graph(matrix, { directed: true });

console.log(graph.hasEdge(0, 1));
