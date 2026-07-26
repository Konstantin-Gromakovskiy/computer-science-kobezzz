## Проверка сложности пароля

Необходимо написать регулярное выражение для проверки, что пароль соответствует требованиям сложности.

Требования:

- Длина: от 8 до 20 символов
- Содержит хотя бы одну заглавную букву (A-Z)
- Содержит хотя бы одну строчную букву (a-z)
- Содержит хотя бы одну цифру (0-9)
- Содержит хотя бы один специальный символ (!@#$%^&*)

```js
const passwordRegex = /________________________/;

console.log(passwordRegex.test("Password123!")); // true
console.log(passwordRegex.test("Password1!")); // false (меньше 8 символов)
console.log(passwordRegex.test("PASSWORD123!")); // false (нет строчных)
console.log(passwordRegex.test("Password!")); // false (нет цифры)
console.log(passwordRegex.test("Pass123")); // false (нет спецсимвола)
console.log(passwordRegex.test("Password123")); // false (нет спецсимвола)
```
