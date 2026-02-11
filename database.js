```javascript const sqlite3 = require('sqlite3').verbose(); const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'exam.db'), (err) => { if (err) { console.error('数据库连接失败:', err.message); } else { console.log('✓ 数据库连接成功'); } });

function initDatabase() { return new Promise((resolve, reject) => { db.serialize(() => { db.run(CREATE TABLE IF NOT EXISTS students ( id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, group_number INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ), (err) => { if (err) console.error('建students表失败:', err); });

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
}); }

function initStudents() { return new Promise((resolve, reject) => { const students = [ { name: '@Oliva Cheng', group: 1 }, { name: '@Xiaoyu Ji', group: 1 }, { name: '@Yifan Zhang', group: 1 }, { name: '@Mengting Wu', group: 1 }, { name: '@Zixuan Li', group: 1 }, { name: '@Jiaqi Wang', group: 1 }, { name: '@Yuxin Chen', group: 2 }, { name: '@Haoran Liu', group: 2 }, { name: '@Siyuan Zhou', group: 2 }, { name: '@Ruoxi Yang', group: 2 }, { name: '@Chenyu Xu', group: 2 }, { name: '@Minghao Sun', group: 2 }, { name: '@Xinyi Zhao', group: 3 }, { name: '@Yunfei Ma', group: 3 }, { name: '@Shiqi Huang', group: 3 }, { name: '@Jingwen Gao', group: 3 }, { name: '@Tianyu Zheng', group: 3 }, { name: '@Yuhan Tang', group: 3 }, { name: '@Zihan Lin', group: 4 }, { name: '@Junhao Wu', group: 4 }, { name: '@Xiaotong He', group: 4 }, { name: '@Yiran Luo', group: 4 }, { name: '@Kexin Song', group: 4 }, { name: '@Weichen Deng', group: 4 }, { name: '@Siyu Pan', group: 5 }, { name: '@Haoyu Xie', group: 5 }, { name: '@Yuchen Qian', group: 5 }, { name: '@Ziqing Jiang', group: 5 }, { name: '@Jiaying Shen', group: 5 }, { name: '@Ruihan Cao', group: 5 } ];

const stmt = db.prepare('INSERT OR IGNORE INTO students (name, group_number) VALUES (?, ?)');
students.forEach(student => {
  stmt.run(student.name, student.group);
});

stmt.finalize((err) => {
  if (err) {
    console.error('初始化学生名单失败:', err);
    reject(err);
  } else {
    console.log('✓ 学生名单初始化完成');
    resolve();
  }
});
}); }

function initQuestions() { return new Promise((resolve, reject) => { const questions = [ { number: 1, answer: 'B', description: 'Amazon Service Discovery 主要功能' }, { number: 2, answer: 'C', description: 'Service Discovery 服务注册方式' }, { number: 3, answer: 'A', description: 'Health Check 机制' }, { number: 4, answer: 'D', description: 'DNS 记录类型' }, { number: 5, answer: 'B', description: 'Service Discovery 集成' } ];

const stmt = db.prepare('INSERT OR REPLACE INTO questions (question_number, correct_answer, description) VALUES (?, ?, ?)');
questions.forEach(q => {
  stmt.run(q.number, q.answer, q.description);
});

stmt.finalize((err) => {
  if (err) {
    console.error('初始化题目失败:', err);
    reject(err);
  } else {
    console.log('✓ 题目答案初始化完成');
    resolve();
  }
});
}); }

module.exports = { db, initDatabase, initStudents, initQuestions };
