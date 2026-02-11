const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'exam.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('✓ 数据库连接成功');
  }
});

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          group_number INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
        if (err) console.error('创建students表失败:', err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_name TEXT NOT NULL,
          group_number INTEGER NOT NULL,
          score INTEGER NOT NULL,
          submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_name) REFERENCES students(name)
        )`, (err) => {
        if (err) console.error('创建submissions表失败:', err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          submission_id INTEGER NOT NULL,
          question_number INTEGER NOT NULL,
          user_answer TEXT NOT NULL,
          correct_answer TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL,
          FOREIGN KEY (submission_id) REFERENCES submissions(id)
        )`, (err) => {
        if (err) console.error('创建answers表失败:', err);
      });

      db.run(`CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_number INTEGER UNIQUE NOT NULL,
          correct_answer TEXT NOT NULL,
          description TEXT
        )`, (err) => {
        if (err) {
          console.error('创建questions表失败:', err);
          reject(err);
        } else {
          console.log('✓ 数据库表初始化完成');
          resolve();
        }
      });
    });
  });
}

function initStudents() {
  return new Promise((resolve, reject) => {
    const students = [
      // 第1组（6人）
      { name: '@Oliva Cheng', group: 1 },
      { name: '@Lemon Zhou', group: 1 },
      { name: '@Yuki Liu', group: 1 },
      { name: '@Alicia Yang', group: 1 },
      { name: '@Cecilia Fu', group: 1 },
      { name: '@Xiaoyu Ji', group: 1 },

      // 第2组（6人）
      { name: '@Felix Li2', group: 2 },
      { name: '@Gabrie Sun', group: 2 },
      { name: '@Lia Zhang', group: 2 },
      { name: '@Alan Huang1', group: 2 },
      { name: '@Rosie Wu', group: 2 },
      { name: '@Evelyn Luo', group: 2 },

      // 第3组（6人）
      { name: '@Cora Wu', group: 3 },
      { name: '@Laura Li', group: 3 },
      { name: '@Kiri Shen', group: 3 },
      { name: '@Kaia Xiao', group: 3 },
      { name: '@Serena Xu', group: 3 },
      { name: '@Le Liu', group: 3 },

      // 第4组（7人）
      { name: '@Lynn Wen', group: 4 },
      { name: '@Hinata Hou', group: 4 },
      { name: '@Charlotte Liu', group: 4 },
      { name: '@Aria Chen1', group: 4 },
      { name: '@Jason Wei', group: 4 },
      { name: '@Norah Xu', group: 4 },
      { name: '@Kayla He', group: 4 },

      // 第5组（6人）
      { name: '@Fanny Lu', group: 5 },
      { name: '@Nydia Zhang', group: 5 },
      { name: '@Evan Yu', group: 5 },
      { name: '@Elia Qin', group: 5 },
      { name: '@Yuanjun Wang', group: 5 },
      { name: '@Sibyl Gu', group: 5 }
    ];

    const stmt = db.prepare('INSERT OR IGNORE INTO students (name, group_number) VALUES (?, ?)');
    students.forEach(student => {
      stmt.run(student.name, student.group);
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('初始化学生名单失败:', err);
        reject(err);
      } else {
        console.log('✓ 学生名单初始化完成（31名学生）');
        resolve();
      }
    });
  });
}

function initQuestions() {
  return new Promise((resolve, reject) => {
    const questions = [
      // 单选题（1-4题）
      { number: 1, answer: 'B', description: 'SD广告最大特点' },
      { number: 2, answer: 'C', description: 'SD核心盈利指标' },
      { number: 3, answer: 'B', description: 'SD不支持的人群' },
      { number: 4, answer: 'B', description: 'SD相比SP的优势' },
      
      // 多选题（5-8题）
      { number: 5, answer: 'ABCD', description: 'SD展示位置（多选）' },
      { number: 6, answer: 'ABC', description: 'SD支持的展示位置（多选）' },
      { number: 7, answer: 'ACD', description: 'SD的竞价策略（多选）' },
      { number: 8, answer: 'ABCD', description: 'SD受众定位方式（多选）' },

      // 判断题（9-10题）
      { number: 9, answer: 'B', description: 'SD只能推广单品（判断题-错误）' },
      { number: 10, answer: 'A', description:成（10题：4单选+4多选+2判断）');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initDatabase,
  initStudents,
  initQuestions
};
