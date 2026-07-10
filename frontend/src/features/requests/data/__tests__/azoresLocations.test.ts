import { describe, it, expect } from 'vitest';
import { findNearestLocation } from '../azoresLocations';

describe('findNearestLocation (local reverse geocoding)', () => {
  it('resolves a point near Angra do Heroísmo to Terceira', () => {
    const result = findNearestLocation(38.6551, -27.2178);
    expect(result?.island).toBe('Terceira');
    expect(result?.municipality).toBe('Angra do Heroísmo');
  });

  it('resolves a point west of Angra to the right island and municipality', () => {
    // Parish is nearest-centroid, so border points may land on a neighbouring
    // parish — island and municipality are the fields that must be right.
    const result = findNearestLocation(38.6642, -27.2616);
    expect(result?.island).toBe('Terceira');
    expect(result?.municipality).toBe('Angra do Heroísmo');
  });

  it('resolves a point at an exact parish centroid to that parish', () => {
    const result = findNearestLocation(38.6867, -27.255); // São Mateus da Calheta centroid
    expect(result?.parish).toBe('São Mateus da Calheta');
  });

  it('resolves a point in Ponta Delgada to São Miguel', () => {
    const result = findNearestLocation(37.7412, -25.6756);
    expect(result?.island).toBe('São Miguel');
    expect(result?.municipality).toBe('Ponta Delgada');
  });

  it('resolves a point on Pico island (not the nearest big island)', () => {
    // Madalena do Pico is ~8 km across the channel from Horta (Faial) —
    // the cos-scaled distance must still pick the Pico side.
    const result = findNearestLocation(38.5333, -28.5266);
    expect(result?.island).toBe('Pico');
  });

  it('resolves Corvo, the smallest island', () => {
    const result = findNearestLocation(39.7, -31.1);
    expect(result?.island).toBe('Corvo');
  });

  it('always returns the full administrative path', () => {
    const result = findNearestLocation(38.7, -27.2);
    expect(result).not.toBeNull();
    expect(result?.island).toBeTruthy();
    expect(result?.municipality).toBeTruthy();
    expect(result?.parish).toBeTruthy();
  });
});
