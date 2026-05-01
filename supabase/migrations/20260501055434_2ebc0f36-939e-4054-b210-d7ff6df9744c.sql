DELETE FROM public.ai_actions WHERE doc_id IN ('41e551d3-d99f-4456-93a1-bd1051616bd6','0b455278-5857-47d6-ac19-df1600b0cf83');
DELETE FROM public.quote_line_items WHERE quote_id = '41e551d3-d99f-4456-93a1-bd1051616bd6';
DELETE FROM public.quotes WHERE id = '41e551d3-d99f-4456-93a1-bd1051616bd6';
DELETE FROM public.clients WHERE id = '0b455278-5857-47d6-ac19-df1600b0cf83';