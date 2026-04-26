type Program = typeof program;

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

const execute = (program: Program) => {
  let programStep = 0;
  let acc = 0;
  let skipNextInstruction = false;

  const cantExecute = () => {
    const result = skipNextInstruction;
    skipNextInstruction = false;
    return result;
  };

  while (programStep < program.length) {
    switch (program[programStep]) {
      case instructions["SET A"]:
        if (cantExecute()) break;
        acc = program[programStep + 1];
        programStep++;
        break;

      case instructions["PRINT A"]:
        if (cantExecute()) break;
        console.log(acc);
        break;

      case instructions["IFN A"]:
        if (cantExecute()) {
          programStep++;
          break;
        }
        if (acc !== 0) {
          skipNextInstruction = true;
        }
        break;

      case instructions["RET"]:
        programStep++;
        if (cantExecute()) break;
        return program[programStep];

      case instructions["DEC A"]:
        if (cantExecute()) break;
        acc--;
        break;
      case instructions["JMP"]:
        programStep++;
        if (cantExecute()) break;
        programStep = program[programStep] - 1;
        break;
      default:
        break;
    }
    programStep++;
  }
};
