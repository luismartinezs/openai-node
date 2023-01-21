import { dot, norm } from "mathjs";

function dotProduct(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) {
    throw new Error("Vectors must have the same length");
  }
  return (
    dot(vector1, vector2) /
    ((norm(vector1) as number) * (norm(vector2) as number))
  );
}

export { dotProduct };
