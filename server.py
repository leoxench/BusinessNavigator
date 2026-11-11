import json, sqlite3, os
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
DB = os.environ.get('JOBLY_DB', str(Path(__file__).with_name('jobly.sqlite3')))
def connect():
    db=sqlite3.connect(DB, timeout=10)
    db.row_factory=sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    return db
def init():
    with connect() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, role TEXT NOT NULL, name TEXT NOT NULL, skills TEXT NOT NULL DEFAULT '');
        CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES users(id), title TEXT NOT NULL, salary TEXT NOT NULL, format TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
        CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id), worker_id INTEGER NOT NULL REFERENCES users(id), message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'sent', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), UNIQUE(job_id,worker_id));
        CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, application_id INTEGER NOT NULL REFERENCES applications(id), sender_id INTEGER NOT NULL REFERENCES users(id), text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
        """)
        db.executemany('INSERT OR IGNORE INTO users VALUES(?,?,?,?)',[(1,'company','Піксель Студія',''),(2,'company','Нова Діджитал',''),(3,'company','Тех Простір',''),(4,'worker','Олександр','Python, Django, SQL'),(5,'worker','Марія','JavaScript, React, Figma')])
        db.executemany('INSERT OR IGNORE INTO jobs(id,company_id,title,salary,format) VALUES(?,?,?,?,?)',[(1,1,'Розробник інтерфейсів','80 000–120 000 ₴','Дистанційно'),(2,2,'Дизайнер інтерфейсів','60 000–90 000 ₴','Гібридно'),(3,3,'Розробник Python','100 000–150 000 ₴','Дистанційно')])
class ApiError(Exception):
    def __init__(self,code,message): self.code,self.message=code,message

def text(data,key,limit,required=True):
    value=data.get(key,'')
    if not isinstance(value,str) or len(value)>limit or (required and not value.strip()):
        raise ApiError(400,'Перевірте поле: '+key)
    return value.strip()
class Handler(BaseHTTPRequestHandler):
    def send_json(self,code,value):
        raw=json.dumps(value,ensure_ascii=False).encode()
        self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
    def do_GET(self): self.handle_api('GET')
    def do_POST(self): self.handle_api('POST')
    def handle_api(self,method):
        try:
            with connect() as db:
                path=self.path.split('?')[0]
                if method=='GET' and path=='/api/users':
                    return self.send_json(200,[dict(r) for r in db.execute('SELECT * FROM users')])
                try: uid=int(self.headers.get('X-Demo-User','0'))
                except ValueError: raise ApiError(401,'Оберіть користувача')
                user=db.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone()
                if not user: raise ApiError(401,'Оберіть користувача')
                if method=='GET' and path=='/api/state':
                    jobs=[dict(r) for r in db.execute('SELECT j.*,u.name company FROM jobs j JOIN users u ON u.id=j.company_id')]
                    apps=[dict(r) for r in db.execute('SELECT a.*,j.title,j.company_id,c.name company,w.name worker,w.skills FROM applications a JOIN jobs j ON j.id=a.job_id JOIN users c ON c.id=j.company_id JOIN users w ON w.id=a.worker_id WHERE a.worker_id=? OR j.company_id=? ORDER BY a.id DESC',(uid,uid))]
                    for a in apps: a['messages']=[dict(r) for r in db.execute('SELECT m.*,u.name sender FROM messages m JOIN users u ON u.id=m.sender_id WHERE application_id=? ORDER BY m.id',(a['id'],))]
                    return self.send_json(200,dict(user=dict(user),jobs=jobs,applications=apps))
                if method!='POST': raise ApiError(404,'Не знайдено')
                size=int(self.headers.get('Content-Length','0'))
                if size<1 or size>16000: raise ApiError(400,'Некоректний розмір запиту')
                data=json.loads(self.rfile.read(size))
                if not isinstance(data,dict): raise ApiError(400,'Очікується JSON-об’єкт')
                if path=='/api/applications':
                    if user['role']!='worker': raise ApiError(403,'Лише для працівника')
                    job=db.execute('SELECT * FROM jobs WHERE id=?',(data.get('job_id'),)).fetchone()
                    if not job or not job['active']: raise ApiError(400,'Вакансія закрита або відсутня')
                    db.execute('INSERT INTO applications(job_id,worker_id,message) VALUES(?,?,?)',(job['id'],uid,text(data,'message',3000)))
                elif path=='/api/jobs':
                    if user['role']!='company': raise ApiError(403,'Лише для компанії')
                    fmt=text(data,'format',50)
                    if fmt not in ['Дистанційно','Гібридно','В офісі']: raise ApiError(400,'Невідомий формат')
                    db.execute('INSERT INTO jobs(company_id,title,salary,format) VALUES(?,?,?,?)',(uid,text(data,'title',100),text(data,'salary',80),fmt))
                elif path=='/api/jobs/close':
                    cursor=db.execute('UPDATE jobs SET active=0 WHERE id=? AND company_id=?',(data.get('job_id'),uid))
                    if not cursor.rowcount: raise ApiError(404,'Вакансію не знайдено')
                elif path=='/api/replies':
                    if user['role']!='company': raise ApiError(403,'Лише для компанії')
                    app=db.execute('SELECT a.* FROM applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=? AND j.company_id=?',(data.get('application_id'),uid)).fetchone()
                    if not app: raise ApiError(404,'Відгук не знайдено')
                    status=data.get('status')
                    if status not in ['reviewing','invited','rejected']: raise ApiError(400,'Невідомий статус')
                    db.execute('INSERT INTO messages(application_id,sender_id,text) VALUES(?,?,?)',(app['id'],uid,text(data,'text',3000)))
                    db.execute('UPDATE applications SET status=? WHERE id=?',(status,app['id']))
                elif path=='/api/profile':
                    if user['role']!='worker': raise ApiError(403,'Лише для працівника')
                    db.execute('UPDATE users SET name=?,skills=? WHERE id=?',(text(data,'name',80),text(data,'skills',1000,False),uid))
                else: raise ApiError(404,'Не знайдено')
            self.send_json(200,{'ok':True})
        except ApiError as e: self.send_json(e.code,{'error':e.message})
        except sqlite3.IntegrityError: self.send_json(409,{'error':'Відгук уже надіслано або дані суперечливі'})
        except (ValueError,TypeError): self.send_json(400,{'error':'Некоректний запит'})
        except Exception:
            import traceback
            traceback.print_exc()
            self.send_json(500,{'error':'Помилка сервера'})
if __name__=='__main__':
    init()
    print('Demo API: http://127.0.0.1:8000 — local development only')
    ThreadingHTTPServer(('127.0.0.1',8000),Handler).serve_forever()
