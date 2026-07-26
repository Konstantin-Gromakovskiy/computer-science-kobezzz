## Проверка email

Необходимо написать регулярное выражение для проверки, является ли строка корректным email-адресом.

Требования:

- Локальная часть (до @): латинские буквы, цифры, точки, подчёркивания, дефисы
- Домен (после @): латинские буквы, цифры, дефисы, точка
- Доменная зона: от 2 до 6 букв (например, .com, .ru, .org)

```js
const emailRegex = /________________________/;

console.log(emailRegex.test("user@example.com")); // true
console.log(emailRegex.test("test@mail.ru")); // true
console.log(emailRegex.test("user123@domain.org")); // true
console.log(emailRegex.test("invalid-email")); // false
console.log(emailRegex.test("user@.com")); // false
console.log(emailRegex.test("user@domain")); // false
console.log(emailRegex.test("user@domain.c")); // false
```
