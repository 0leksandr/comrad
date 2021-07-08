import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import App from './app/App';
import {Position} from "./app/General";

function assertIsRound(element: Element): void {
  const styles = window.getComputedStyle(element);
  const style = (property: string): number => {
    return parseInt(styles.getPropertyValue(property))
  }
  expect(style("width")).toEqual(style("height"))
  expect(style("width") / 2).toEqual(style('border-radius'))
}

function getCenterPosition(element: Element): Position {
  const styles = window.getComputedStyle(element);
  const style = (property: string): number => {
    return parseInt(styles.getPropertyValue(property))
  }
  return new Position(
      style("left") + style("width") / 2,
      -(style("top") + style("height") / 2)
  )
}

function getDistance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function checkNodes(): void {
  const nodes = Array.from(document.querySelectorAll(".node"))

  nodes.forEach(assertIsRound)

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      expect(getDistance(getCenterPosition(nodes[i]), getCenterPosition(nodes[j])))
          // .toBeGreaterThanOrEqual(100)
          .toBeGreaterThanOrEqual(70)
    }
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

test('nodes are spread evenly', async () => {
  render(<App />);
  // const {container} = render(<App />);
  await sleep(1000)
  checkNodes()
  fireEvent.click(screen.getByText("comment 3"))
  await sleep(1000)
  checkNodes()
});
