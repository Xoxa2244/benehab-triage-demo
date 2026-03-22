import csv
import importlib
from io import StringIO

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient


@pytest.fixture()
def backend(tmp_path, monkeypatch):
    monkeypatch.setenv("LITE_COLOR_TEST_STORAGE_PATH", str(tmp_path / "storage.json"))
    from app import main as main_module
    from app import models

    importlib.reload(main_module)
    return main_module, models


def test_project_duplicate_and_crud(backend):
    main, models = backend

    projects = main.list_projects()
    assert len(projects) >= 1

    project = main.create_project(
        models.ProjectCreateRequest(
            name='Experiment A',
            description='Project for parallel testing',
            status='draft',
        )
    )
    assert project.name == 'Experiment A'

    duplicated = main.duplicate_project(project.id)
    assert duplicated.id != project.id
    assert duplicated.name.endswith('(copy)')
    assert len(duplicated.concepts) > 0
    assert len(duplicated.palette) > 0


def test_end_to_end_survey_run_and_results(backend):
    main, models = backend

    project = main.create_project(
        models.ProjectCreateRequest(name='Flow Project', description='', status='active')
    )

    concepts = main.get_project_concepts(project.id)
    palette = main.get_project_palette(project.id)
    metrics = main.list_project_metrics(project.id)

    reordered_concepts = list(reversed(concepts))
    for index, item in enumerate(reordered_concepts):
        item.position = index
    saved_concepts = main.update_project_concepts(
        project.id, models.ConceptsUpdateRequest(concepts=reordered_concepts)
    )
    assert len(saved_concepts) == len(concepts)

    extended_palette = palette + [
        models.OrderedColor(
            id='tmp_new',
            label='Teal',
            hex='#14b8a6',
            position=len(palette),
            is_active=True,
        )
    ]
    saved_palette = main.update_project_palette(
        project.id, models.PaletteUpdateRequest(palette=extended_palette)
    )
    assert len(saved_palette) == len(palette) + 1

    metric = metrics[0]
    concepts = main.get_project_concepts(project.id)
    palette = main.get_project_palette(project.id)

    n = len(concepts)
    c = len(palette)
    updated_metric = main.update_project_metric(
        project.id,
        metric.id,
        models.MetricUpdateRequest(
            name=metric.name,
            is_active=True,
            similarity_same_weights=[[0.1 for _ in range(n)] for _ in range(n)],
            similarity_diff_weights=[[0.2 for _ in range(n)] for _ in range(n)],
            attractiveness_rank_weights=[[0.3 for _ in range(c)] for _ in range(n)],
        ),
    )
    assert updated_metric.id == metric.id

    user = main.create_synthetic_user(
        models.SyntheticUserCreateRequest(display_name='Tester 1', note='')
    )

    active_concepts = [item for item in concepts if item.is_active]
    active_palette = [item for item in palette if item.is_active]

    concept_choices = {concept.id: active_palette[0].id for concept in active_concepts}
    rank_order = [color.id for color in active_palette]

    run = main.create_survey_run(
        project.id,
        models.SurveyRunCreateRequest(
            user_id=user.id,
            concept_color_choices=concept_choices,
            color_rank_order=rank_order,
        ),
    )
    assert run.project_id == project.id
    assert run.user_id == user.id
    assert len(run.calculated_metrics) >= 1

    users_results = main.user_results()
    assert any(item.user_id == user.id and item.project_id == project.id for item in users_results)

    runs = main.list_survey_runs(project_id=project.id, user_id=user.id, date_from=None, date_to=None)
    assert len(runs) == 1


def test_metric_values_must_have_step_01(backend):
    main, models = backend

    project = main.create_project(
        models.ProjectCreateRequest(name='Validation Project', description='', status='active')
    )
    metric = main.list_project_metrics(project.id)[0]
    concepts = main.get_project_concepts(project.id)
    palette = main.get_project_palette(project.id)

    n = len(concepts)
    c = len(palette)

    with pytest.raises(HTTPException) as exc:
        main.update_project_metric(
            project.id,
            metric.id,
            models.MetricUpdateRequest(
                name=metric.name,
                is_active=True,
                similarity_same_weights=[[0.15 for _ in range(n)] for _ in range(n)],
                similarity_diff_weights=[[0.2 for _ in range(n)] for _ in range(n)],
                attractiveness_rank_weights=[[0.3 for _ in range(c)] for _ in range(n)],
            ),
        )

    assert exc.value.status_code == 400
    assert '0.1 step' in str(exc.value.detail)


def test_user_results_csv_export(backend):
    main, models = backend

    project = main.create_project(
        models.ProjectCreateRequest(name='CSV Project', description='', status='active')
    )
    metric = main.list_project_metrics(project.id)[0]
    concepts = main.get_project_concepts(project.id)
    palette = main.get_project_palette(project.id)

    user = main.create_synthetic_user(
        models.SyntheticUserCreateRequest(display_name='CSV Tester', note='')
    )

    active_concepts = [item for item in concepts if item.is_active]
    active_palette = [item for item in palette if item.is_active]
    concept_choices = {concept.id: active_palette[0].id for concept in active_concepts}
    rank_order = [color.id for color in active_palette]

    run = main.create_survey_run(
        project.id,
        models.SurveyRunCreateRequest(
            user_id=user.id,
            concept_color_choices=concept_choices,
            color_rank_order=rank_order,
        ),
    )

    client = TestClient(main.app)
    response = client.get('/api/results/users.csv')

    assert response.status_code == 200
    assert response.headers['content-type'].startswith('text/csv')
    assert 'attachment' in response.headers['content-disposition']

    reader = csv.reader(StringIO(response.text))
    header = next(reader)
    row = next(reader)

    assert header[:6] == [
        'user_id',
        'user_name',
        'project_id',
        'project_name',
        'runs_count',
        'last_completed_at',
    ]
    assert row[0] == user.id
    assert row[1] == 'CSV Tester'
    assert row[2] == project.id
    assert row[3] == 'CSV Project'
    assert row[4] == '1'
    assert row[5] == run.completed_at
    assert f'metric_{metric.name}' in header
    metric_index = header.index(f'metric_{metric.name}')
    assert row[metric_index] == str(run.calculated_metrics[metric.name])
