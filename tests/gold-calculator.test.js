import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateGoldPrice, parsePercentage, validateWeight } from '../src/gold-calculator.js';

test('accepts and calculates an exact decimal weight', () => {
  const weight = validateWeight('1.2', 0.25);
  const price = calculateGoldPrice(170, weight.value, 0, 9);

  assert.equal(weight.error, '');
  assert.equal(price.goldValue, 204);
  assert.equal(price.gst, 18.36);
  assert.equal(price.total, 222.36);
});

test('applies making charge before GST', () => {
  const price = calculateGoldPrice(170, 1.2, 10, 9);

  assert.equal(price.goldValue, 204);
  assert.equal(price.makingCharge, 20.4);
  assert.equal(price.beforeGst, 224.4);
  assert.equal(price.gst, 20.196);
  assert.equal(price.total, 244.596);
});

test('validates the purity-specific minimum and shared maximum', () => {
  assert.equal(validateWeight('0.25', 0.25).value, 0.25);
  assert.equal(validateWeight('0.75', 1).error, 'Minimum weight is 1 g.');
  assert.equal(validateWeight('1000.01', 0.25).error, 'Maximum weight is 1000 g.');
});

test('requires a valid non-empty decimal weight', () => {
  assert.equal(validateWeight('', 0.25).error, 'Enter a weight in grams.');
  assert.equal(validateWeight('abc', 0.25).error, 'Enter a valid decimal weight in grams.');
  assert.equal(validateWeight('1.2.3', 0.25).error, 'Enter a valid decimal weight in grams.');
});

test('accepts only non-negative decimal percentages', () => {
  assert.equal(parsePercentage('9'), 9);
  assert.equal(parsePercentage('1.25'), 1.25);
  assert.equal(parsePercentage('1.'), 1);
  assert.equal(parsePercentage('-1'), null);
  assert.equal(parsePercentage(''), null);
});