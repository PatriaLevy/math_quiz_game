<?php
/* ========================================== */
/* DATABASE CONNECTION */
/* ========================================== */
header('Content-Type: application/json');

// Database configuration
$host = 'localhost';
$dbname = 'math_quiz_game';
$username = 'root';  // Change this to your MySQL username
$password = '';      // Change this to your MySQL password

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);
    exit();
}


/* ========================================== */
/* GET REQUEST HANDLING */
/* ========================================== */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'getHighScores') {
        getHighScores($pdo);
    } elseif ($action === 'getLeaderboard') {
        getLeaderboard($pdo);
    }
}

/* ========================================== */
/* POST REQUEST HANDLING */
/* ========================================== */
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    if ($action === 'saveHighScore') {
        saveHighScore($pdo, $input);
    } elseif ($action === 'saveGameStats') {
        saveGameStats($pdo, $input);
    }
}

else {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid request method'
    ]);
}


/* ========================================== */
/* FUNCTION: GET HIGH SCORES */
/* ========================================== */
function getHighScores($pdo) {
    $username = $_GET['username'] ?? '';
    
    if (empty($username)) {
        echo json_encode([
            'success' => false,
            'error' => 'Username required'
        ]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                difficulty, 
                MAX(score) as high_score 
            FROM high_scores 
            WHERE username = ? 
            GROUP BY difficulty
        ");
        $stmt->execute([$username]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $scores = [
            'easy' => 0,
            'medium' => 0,
            'hard' => 0
        ];
        
        foreach ($results as $row) {
            $scores[$row['difficulty']] = (int)$row['high_score'];
        }
        
        echo json_encode([
            'success' => true,
            'scores' => $scores
        ]);
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}


/* ========================================== */
/* FUNCTION: GET LEADERBOARD */
/* ========================================== */
function getLeaderboard($pdo) {
    $difficulty = $_GET['difficulty'] ?? 'easy';
    $limit = $_GET['limit'] ?? 10;
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                username, 
                MAX(score) as high_score, 
                MAX(created_at) as last_played
            FROM high_scores 
            WHERE difficulty = ? 
            GROUP BY username
            ORDER BY high_score DESC
            LIMIT ?
        ");
        $stmt->execute([$difficulty, (int)$limit]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'leaderboard' => $results
        ]);
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}


/* ========================================== */
/* FUNCTION: SAVE HIGH SCORE */
/* ========================================== */
function saveHighScore($pdo, $input) {
    $username = $input['username'] ?? '';
    $difficulty = $input['difficulty'] ?? '';
    $score = $input['score'] ?? 0;
    
    // Validate input
    if (empty($username) || empty($difficulty)) {
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        return;
    }
    
    // Validate difficulty
    if (!in_array($difficulty, ['easy', 'medium', 'hard'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid difficulty'
        ]);
        return;
    }
    
    try {
        // Check if this is a new high score
        $stmt = $pdo->prepare("
            SELECT MAX(score) as current_high_score 
            FROM high_scores 
            WHERE username = ? AND difficulty = ?
        ");
        $stmt->execute([$username, $difficulty]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $currentHighScore = $result['current_high_score'] ?? 0;
        
        // Only save if it's a new high score
        if ($score > $currentHighScore) {
            $stmt = $pdo->prepare("
                INSERT INTO high_scores 
                (username, difficulty, score, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$username, $difficulty, $score]);
            
            echo json_encode([
                'success' => true,
                'message' => 'New high score saved!',
                'isNewHighScore' => true
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Score recorded',
                'isNewHighScore' => false
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}


/* ========================================== */
/* FUNCTION: SAVE GAME STATISTICS */
/* ========================================== */
function saveGameStats($pdo, $input) {
    $username = $input['username'] ?? '';
    $difficulty = $input['difficulty'] ?? '';
    $score = $input['score'] ?? 0;
    $correct = $input['correct'] ?? 0;
    $wrong = $input['wrong'] ?? 0;
    $total = $input['total'] ?? 0;
    $accuracy = $input['accuracy'] ?? 0;
    
    // Validate input
    if (empty($username) || empty($difficulty)) {
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO game_stats 
            (
                username, 
                difficulty, 
                score, 
                correct_answers, 
                wrong_answers, 
                total_questions, 
                accuracy, 
                played_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $username,
            $difficulty,
            $score,
            $correct,
            $wrong,
            $total,
            $accuracy
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Game stats saved'
        ]);
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>