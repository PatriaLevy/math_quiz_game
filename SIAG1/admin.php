<?php
/* ========================================== */
/* ADMIN PAGE - VIEW ALL GAME DATA */
/* ========================================== */

// Database configuration
$host = 'localhost';
$dbname = 'math_quiz_game';
$username = 'root';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Get all high scores
$highScoresStmt = $pdo->query("
    SELECT 
        username, 
        difficulty, 
        score, 
        created_at 
    FROM high_scores 
    ORDER BY created_at DESC 
    LIMIT 50
");
$highScores = $highScoresStmt->fetchAll(PDO::FETCH_ASSOC);

// Get all game stats
$gameStatsStmt = $pdo->query("
    SELECT 
        username, 
        difficulty, 
        score, 
        correct_answers, 
        wrong_answers, 
        total_questions, 
        accuracy, 
        played_at 
    FROM game_stats 
    ORDER BY played_at DESC 
    LIMIT 50
");
$gameStats = $gameStatsStmt->fetchAll(PDO::FETCH_ASSOC);

// Get player statistics
$playerStatsStmt = $pdo->query("
    SELECT 
        username,
        COUNT(*) as games_played,
        AVG(score) as avg_score,
        MAX(score) as best_score,
        AVG(accuracy) as avg_accuracy
    FROM game_stats
    GROUP BY username
    ORDER BY best_score DESC
");
$playerStats = $playerStatsStmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Game Statistics</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 42px;
        }
        
        .section {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        
        h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tr:hover {
            background: #f3f4f6;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        
        .badge.easy {
            background: #10b981;
        }
        
        .badge.medium {
            background: #f59e0b;
        }
        
        .badge.hard {
            background: #ef4444;
        }
        
        .back-btn {
            display: inline-block;
            padding: 12px 30px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        
        .back-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="index.html" class="back-btn">← Back to Game</a>
        
        <h1>🎮 Game Statistics Dashboard</h1>
        
        <!-- Summary Stats -->
        <div class="section">
            <h2>📊 Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value"><?php echo count($playerStats); ?></div>
                    <div class="stat-label">Total Players</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?php echo count($gameStats); ?></div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value"><?php echo count($highScores); ?></div>
                    <div class="stat-label">Score Records</div>
                </div>
            </div>
        </div>
        
        <!-- Player Statistics -->
        <div class="section">
            <h2>👥 Player Statistics</h2>
            <?php if (count($playerStats) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Games Played</th>
                        <th>Average Score</th>
                        <th>Best Score</th>
                        <th>Average Accuracy</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($playerStats as $player): ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($player['username']); ?></strong></td>
                        <td><?php echo $player['games_played']; ?></td>
                        <td><?php echo number_format($player['avg_score'], 0); ?></td>
                        <td><?php echo $player['best_score']; ?></td>
                        <td><?php echo number_format($player['avg_accuracy'], 1); ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <div class="no-data">No player data yet. Play some games first! 🎮</div>
            <?php endif; ?>
        </div>
        
        <!-- Recent Games -->
        <div class="section">
            <h2>🎯 Recent Game Sessions</h2>
            <?php if (count($gameStats) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Difficulty</th>
                        <th>Score</th>
                        <th>Correct</th>
                        <th>Wrong</th>
                        <th>Total</th>
                        <th>Accuracy</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($gameStats as $game): ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($game['username']); ?></strong></td>
                        <td>
                            <span class="badge <?php echo $game['difficulty']; ?>">
                                <?php echo ucfirst($game['difficulty']); ?>
                            </span>
                        </td>
                        <td><?php echo $game['score']; ?></td>
                        <td style="color: #10b981;"><?php echo $game['correct_answers']; ?></td>
                        <td style="color: #ef4444;"><?php echo $game['wrong_answers']; ?></td>
                        <td><?php echo $game['total_questions']; ?></td>
                        <td><?php echo $game['accuracy']; ?>%</td>
                        <td><?php echo date('M d, Y H:i', strtotime($game['played_at'])); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <div class="no-data">No games played yet. Start playing! 🎲</div>
            <?php endif; ?>
        </div>
        
        <!-- High Score History -->
        <div class="section">
            <h2>🏆 High Score History</h2>
            <?php if (count($highScores) > 0): ?>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Difficulty</th>
                        <th>Score</th>
                        <th>Date Achieved</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($highScores as $score): ?>
                    <tr>
                        <td><strong><?php echo htmlspecialchars($score['username']); ?></strong></td>
                        <td>
                            <span class="badge <?php echo $score['difficulty']; ?>">
                                <?php echo ucfirst($score['difficulty']); ?>
                            </span>
                        </td>
                        <td><?php echo $score['score']; ?></td>
                        <td><?php echo date('M d, Y H:i', strtotime($score['created_at'])); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <div class="no-data">No scores recorded yet. Play a game! 🏆</div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>