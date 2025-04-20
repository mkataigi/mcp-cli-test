/**
 * 与えられた数値が素数かどうかを判定します。
 *
 * @param num 判定する数値
 * @returns 素数の場合は true、そうでない場合は false
 */
function isPrime(num: number): boolean {
  // 1 以下は素数ではない
  if (num <= 1) {
    return false;
  }
  // 2 は素数
  if (num === 2) {
    return true;
  }
  // 偶数は素数ではない (2 を除く)
  if (num % 2 === 0) {
    return false;
  }
  // 3 から平方根まで奇数で割ってみる
  const sqrtNum = Math.sqrt(num);
  for (let i = 3; i <= sqrtNum; i += 2) {
    if (num % i === 0) {
      return false;
    }
  }
  // 割り切れなければ素数
  return true;
}

// 使用例
console.log(isPrime(2)); // true
console.log(isPrime(3)); // true
console.log(isPrime(4)); // false
console.log(isPrime(17)); // true
console.log(isPrime(100)); // false
