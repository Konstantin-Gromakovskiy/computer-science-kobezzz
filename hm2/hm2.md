## Написать простой интерпретатор байткода

Представьте, что наш процессор — очень глупое устройство. Он понимает только цифры, а не слова вроде PRINT. Поэтому мы придумываем кодовые обозначения для команд:

- SET A — положить число в ячейку памяти A (код 0)
- PRINT A — показать, что лежит в A (код 1)
- DEC A — уменьшить A на 1 (код 4)
- И так далее...

Получается, что программа — это просто список чисел. Например, строчка `[0, 10]` означает: "выполни команду SET A (код 0) с числом 10".

**Что делает программа из примера?**

```js
const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

const program = [
  // Ставим значения аккумулятора
  instructions["SET A"],
  // В 10
  10,

  // Выводим значение на экран
  instructions["PRINT A"],

  // Если A равно 0
  instructions["IFN A"],

  // Программа завершается
  instructions["RET"],

  // И возвращает 0
  0,

  // Уменьшаем A на 1
  instructions["DEC A"],

  // Устанавливаем курсор выполняемой инструкции
  instructions["JMP"],

  // В значение 2
  2,
];

// Выведет в консоль
// 10
// 9
// 8
// 7
// 6
// 5
// 4
// 3
// 2
// 1
// 0
// И вернет 0
execute(program);
```

Программа выводит числа от 10 до 0. Вот как она работает по шагам:

1. Положить в A число 10
2. Напечатать текущее A (в консоли появится 10)
3. Проверить, не равно ли A нулю?
   - Если равно — закончить работу и вернуть 0
4. Уменьшить A на 1 (было 10, стало 9)
5. Перейти обратно к шагу 2
6. Повторять, пока A не станет 0

**Что нужно сделать?**

Вам предстоит написать функцию execute, которая будет "оживлять" эти цифры. Она должна:

- Ходить по программе шаг за шагом (как процессор или виртуальная машина)
- Смотреть на текущую команду (число) и понимать, что она означает
- Выполнять нужное действие (например, при виде кода 1 — печатать значение)
- Запоминать, чему сейчас равно A (это наша переменная)

<details>
<summary><strong>Смотреть решение</strong></summary>

```js
const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

const program = [
  // Ставим значения аккумулятора
  instructions["SET A"],
  // В 10
  10,

  // Выводим значение на экран
  instructions["PRINT A"],

  // Если A равно 0
  instructions["IFN A"],

  // Программа завершается
  instructions["RET"],

  // И возвращает 0
  0,

  // Уменьшаем A на 1
  instructions["DEC A"],

  // Устанавливаем курсор выполняемой инструкции
  instructions["JMP"],

  // В значение 2
  2,
];

function execute(program) {
  let acc = 0;
  let cursor = 0;

  let currInstruction = program[cursor];
  let skipNextInstruction = false;

  /**
   * Возвращает true, если исполняемая инструкция может быть выполнена.
   * Почему это важно: если инструкция IFN A даст ложный результат,
   * то придется пропустить следующую за ней инструкцию.
   * Проблема в том, что мы не знаем сколько "байт" нужно пропустить,
   * поэтому мы просто ставим флаг skipNextInstruction и продолжаем идти по байткоду,
   * но с учетом того, что следующее вычисление нужно пропустить.
   * @returns {boolean}
   */
  function canExecute() {
    const result = !skipNextInstruction;
    skipNextInstruction = false;
    return result;
  }

  while (currInstruction != null) {
    switch (currInstruction) {
      case instructions["SET A"]:
        cursor++;

        if (canExecute()) {
          acc = program[cursor];
        }

        break;

      case instructions["PRINT A"]:
        if (canExecute()) {
          console.log(acc);
        }

        break;

      case instructions["IFN A"]:
        if (canExecute()) {
          if (acc !== 0) {
            skipNextInstruction = true;
          }

          // Вложенный if внутри пропускаемого if
        } else {
          skipNextInstruction = true;
        }

        break;

      case instructions["RET"]:
        cursor++;

        if (canExecute()) {
          return program[cursor];
        }

        break;

      case instructions["DEC A"]:
        if (canExecute()) {
          acc--;
        }

        break;

      case instructions["JMP"]:
        cursor++;

        if (canExecute()) {
          cursor = program[cursor] - 1;
        }

        break;
    }

    currInstruction = program[++cursor];
  }
}

// Выведет в консоль
// 10
// 9
// 8
// 7
// 6
// 5
// 4
// 3
// 2
// 1
// 0
// И вернет 0
console.log(execute(program));
```

</details>
