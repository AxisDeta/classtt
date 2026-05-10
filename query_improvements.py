import os
import mysql.connector

db_config = {
    'host': os.getenv('MYSQL_HOST', '127.0.0.1'),
    'port': int(os.getenv('MYSQL_PORT', 3306)),
    'database': os.getenv('MYSQL_DATABASE', 'study_scheduler'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', '')
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

cursor.execute('SELECT subject_code, recommendation_type, content FROM recommendations WHERE recommendation_type = "improvement" AND acknowledged = 0 ORDER BY created_at DESC')

improvements = cursor.fetchall()

print('Improvement Areas (7 total):')
for i, rec in enumerate(improvements, 1):
    print(f'{i}. {rec["subject_code"]}: {rec["content"]}')

cursor.close()
conn.close()