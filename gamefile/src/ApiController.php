<?php
/** Handles api.php?action=load (GET) and api.php?action=save (POST, JSON) for the logged-in player. */
class ApiController
{
    public function __construct(private SaveRepository $repo) {}

    public function handle(): void
    {
        $userId = Auth::userId();
        if ($userId === null) {
            $this->out(['error' => 'not logged in'], 401);
        }
        $action = $_GET['action'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'];
        try {
            if ($action === 'load' && $method === 'GET') {
                $this->out($this->repo->load($userId) ?? new stdClass());
            } elseif ($action === 'save' && $method === 'POST') {
                $clean = SaveRepository::clean(json_decode(file_get_contents('php://input'), true));
                if ($clean === null) {
                    $this->out(['error' => 'bad data'], 400);
                }
                $result = $this->repo->save($userId, $clean);
                if (!$result['saved']) {
                    // A newer save already reached the server, so this one was
                    // too old to store. The client takes the number and tries
                    // again with the next save.
                    $this->out(['saved' => false, 'stale' => true, 'seq' => $result['seq']], 409);
                }
                $this->out(['saved' => true, 'seq' => $result['seq']]);
            } else {
                $this->out(['error' => 'unknown action'], 400);
            }
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->out(['error' => 'server error'], 500);
        }
    }

    private function out(mixed $data, int $code = 200)
    {
        http_response_code($code);
        echo json_encode($data);
        exit();
    }
}
