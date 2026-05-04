

// Diamond-square fractal algorithm. Width and height must be 2^n + 1
// This starts with a random value on 4 sides, then gets a random value
// for the middle points between each, and then repeats subdividing the

import type { Array2D } from "../util/array2d";
import { Random } from "../util/random";

// original by 4, until all points are set.
export function diamondSquare(map: Array2D<number>, 
	roughness: number = 0.55, 
	initialScale: number = 20.0
) {
	const size = map.width;

	// First, find each of the corners of the whole map, and make
	// random points
	map.set(Random.next(0, initialScale), 0,        0       );
	map.set(Random.next(0, initialScale), size - 1, 0       );
	map.set(Random.next(0, initialScale), 0,        size - 1);
	map.set(Random.next(0, initialScale), size - 1, size - 1);

	let step = size - 1;

	// As we go, the scale will continue to halve until all points 
	// are set. This is why it must be 2^n + 1.
	let scale = initialScale;

	// When the step is 1, the midpoints are 1 point away from the
	// corners, thus, we have set all the remaining ones.
	while (step > 1) {
		const half = step / 2;

		for (let y = 0; y < size - 1; y += step) {
			for (let x = 0; x < size - 1; x += step) {
				//The very very middle point, average of all 4.
				const avg = (
					map.get(x,        y       )! +
					map.get(x + step, y       )! +
					map.get(x,        y + step)! +
					map.get(x + step, y + step)!
				) / 4;
				map.set(avg + Random.next(-scale, scale), x + half, y + half);
			}
		}

		for (let y = 0; y < size; y += half) {
			for (let x = (y + half) % step; x < size; x += step) {
				// This one sets the corners, getting which corner it is on
				let sum = 0, count = 0;
				if (x - half >= 0)   { sum += map.get(x - half, y)!; count++; }
				if (x + half < size) { sum += map.get(x + half, y)!; count++; }
				if (y - half >= 0)   { sum += map.get(x, y - half)!; count++; }
				if (y + half < size) { sum += map.get(x, y + half)!; count++; }
				map.set(sum / count + Random.next(-scale, scale), x, y);
			}
		}

		step = half;
		scale *= Math.pow(2, -roughness);
	}
}